package repos

import (
	"context"

	"auth/internal/core/domain"
)

// OrgRepo reads user organization memberships.
type OrgRepo interface {
	// FindByUserID returns memberships for a user.
	FindByUserID(ctx context.Context, userID string) ([]domain.OrgMembership, error)
}
