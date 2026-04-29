package repos

import (
	"context"

	"auth/internal/core/domain"
)

// SessionRepo stores opaque user sessions.
type SessionRepo interface {
	// Create stores a session and returns its opaque token.
	Create(ctx context.Context, session domain.Session) (token string, err error)
	// Find returns a session by token, or nil when absent.
	Find(ctx context.Context, token string) (*domain.Session, error)
	// Delete removes a session idempotently.
	Delete(ctx context.Context, token string) error
}
