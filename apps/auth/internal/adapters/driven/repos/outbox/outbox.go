// Package outbox writes org events in the caller transaction and relays them to kafka
package outbox

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// OrgTopic mirrors topics.identityOrg from packages/contracts
const OrgTopic = "identity.org.v1"

const (
	// OrgCreated is published once an org and its owner membership exist
	OrgCreated = "OrgCreated"
	// OrgDeleted is published when an org is removed with its memberships
	OrgDeleted = "OrgDeleted"
)

// OrgCreatedPayload mirrors orgCreatedSchema from packages/contracts
type OrgCreatedPayload struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	OwnerID     string `json:"ownerId"`
}

type envelope struct {
	EventID     string `json:"eventId"`
	Type        string `json:"type"`
	Version     int    `json:"version"`
	OccurredAt  string `json:"occurredAt"`
	AggregateID string `json:"aggregateId"`
	OrgID       string `json:"orgId"`
	Payload     any    `json:"payload"`
}

// WriteOrgEvent inserts an org event into auth.outbox within tx
func WriteOrgEvent(ctx context.Context, tx pgx.Tx, eventType string, orgID string, payload any) error {
	eventID, err := uuid.NewV7()
	if err != nil {
		return fmt.Errorf("outbox event id: %w", err)
	}

	body, err := json.Marshal(envelope{
		EventID:     eventID.String(),
		Type:        eventType,
		Version:     1,
		OccurredAt:  time.Now().UTC().Format("2006-01-02T15:04:05.000Z07:00"),
		AggregateID: orgID,
		OrgID:       orgID,
		Payload:     payload,
	})
	if err != nil {
		return fmt.Errorf("outbox marshal: %w", err)
	}

	if _, err := tx.Exec(
		ctx,
		`INSERT INTO auth.outbox (event_id, topic, key, payload) VALUES ($1, $2, $3, $4)`,
		// string keeps simple protocol from sending json as bytea
		eventID.String(), OrgTopic, orgID, string(body),
	); err != nil {
		return fmt.Errorf("outbox insert: %w", err)
	}

	return nil
}
