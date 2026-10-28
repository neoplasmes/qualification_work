package outbox

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kerr"
	"github.com/twmb/franz-go/pkg/kgo"
)

const (
	relayInterval = 200 * time.Millisecond
	relayBatch    = 500
	orgPartitions = 3
)

// Relay delivers auth.outbox rows to kafka in id order
type Relay struct {
	pool   *pgxpool.Pool
	client *kgo.Client
}

// NewRelay creates an idempotent producer with acks=all
func NewRelay(pool *pgxpool.Pool, brokers []string) (*Relay, error) {
	client, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.RequiredAcks(kgo.AllISRAcks()),
		kgo.ClientID("auth-outbox"),
	)
	if err != nil {
		return nil, fmt.Errorf("kafka client: %w", err)
	}

	return &Relay{pool: pool, client: client}, nil
}

// EnsureTopic creates the compacted org topic when it is missing
func (relay *Relay) EnsureTopic(ctx context.Context, replicas int16) error {
	admin := kadm.NewClient(relay.client)
	compact := "compact"

	responses, err := admin.CreateTopics(ctx, orgPartitions, replicas, map[string]*string{
		"cleanup.policy": &compact,
	}, OrgTopic)
	if err != nil {
		return fmt.Errorf("create topic: %w", err)
	}

	for _, response := range responses {
		if response.Err != nil && !errors.Is(response.Err, kerr.TopicAlreadyExists) {
			return fmt.Errorf("create topic %s: %w", response.Topic, response.Err)
		}
	}

	return nil
}

// Run publishes batches until ctx is done
func (relay *Relay) Run(ctx context.Context) {
	ticker := time.NewTicker(relayInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := relay.tick(ctx); err != nil && ctx.Err() == nil {
				slog.Error("outbox relay tick failed", "error", err)
			}
		}
	}
}

// Close flushes and closes the producer
func (relay *Relay) Close() {
	relay.client.Close()
}

func (relay *Relay) tick(ctx context.Context) error {
	tx, err := relay.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("relay begin: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var locked bool
	if err := tx.QueryRow(ctx, `SELECT pg_try_advisory_xact_lock(hashtext('auth.outbox'))`).Scan(&locked); err != nil {
		return fmt.Errorf("relay lock: %w", err)
	}
	if !locked {
		return nil
	}

	rows, err := tx.Query(
		ctx,
		`SELECT id, topic, key, payload::text FROM auth.outbox
		 WHERE published_at IS NULL
		 ORDER BY id
		 LIMIT $1`,
		relayBatch,
	)
	if err != nil {
		return fmt.Errorf("relay select: %w", err)
	}

	ids := make([]int64, 0, relayBatch)
	records := make([]*kgo.Record, 0, relayBatch)
	for rows.Next() {
		var id int64
		var topic, key, payload string
		if err := rows.Scan(&id, &topic, &key, &payload); err != nil {
			rows.Close()

			return fmt.Errorf("relay scan: %w", err)
		}

		ids = append(ids, id)
		records = append(records, &kgo.Record{Topic: topic, Key: []byte(key), Value: []byte(payload)})
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return fmt.Errorf("relay rows: %w", err)
	}

	if len(records) == 0 {
		return nil
	}

	if err := relay.client.ProduceSync(ctx, records...).FirstErr(); err != nil {
		return fmt.Errorf("relay produce: %w", err)
	}

	if _, err := tx.Exec(ctx, `UPDATE auth.outbox SET published_at = now() WHERE id = ANY($1)`, ids); err != nil {
		return fmt.Errorf("relay mark: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("relay commit: %w", err)
	}

	return nil
}
