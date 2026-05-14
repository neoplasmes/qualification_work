package repos

import (
	"context"
	"time"
)

const UserEventsStream = "auth:user-events"
const UserRegisteredEventType = "user.registered"

// UserRegisteredEvent describes a newly registered user
type UserRegisteredEvent struct {
	UserID     string
	Username   string
	OccurredAt time.Time
}

// EventPublisher stores auth domain events for other consumers
type EventPublisher interface {
	PublishUserRegistered(ctx context.Context, event UserRegisteredEvent) error
}
