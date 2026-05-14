package events

import (
	"context"
	"fmt"
	"time"

	"auth/internal/core/ports/driven/repos"

	"github.com/redis/go-redis/v9"
)

// Repo is a redis-based events repository.
type Repo struct {
	client *redis.Client
}

// NewRedis creates a redis-based events repository.
func NewRedis(client *redis.Client) *Repo {
	return &Repo{
		client: client,
	}
}

// PublishUserRegistered appends a user registration event to redis streams.
func (repo *Repo) PublishUserRegistered(ctx context.Context, event repos.UserRegisteredEvent) error {
	_, err := repo.client.XAdd(ctx, &redis.XAddArgs{
		Stream: repos.UserEventsStream,
		Values: map[string]any{
			"type":       repos.UserRegisteredEventType,
			"userId":     event.UserID,
			"username":   event.Username,
			"occurredAt": event.OccurredAt.UTC().Format(time.RFC3339Nano),
		},
	}).Result()
	if err != nil {
		return fmt.Errorf("redis.events.PublishUserRegistered: %w", err)
	}

	return nil
}

var _ repos.EventPublisher = (*Repo)(nil)
