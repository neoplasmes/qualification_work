package repos

import (
	"context"

	"auth/internal/core/domain"
)

// OrgCreateParams contains fields required to create an org
type OrgCreateParams struct {
	Name        string
	DisplayName string
	OwnerID     string
}

// OrgRepo stores organizations and memberships, every change also emits an outbox event
type OrgRepo interface {
	// FindByUserID returns memberships for a user.
	FindByUserID(ctx context.Context, userID string) ([]domain.OrgMembership, error)
	// FindRole returns the user's role in the org, empty if the user is not a member
	FindRole(ctx context.Context, orgID string, userID string) (domain.OrgRole, error)
	// Create inserts the org with an owner membership and returns its ID
	Create(ctx context.Context, params OrgCreateParams) (id string, err error)
	// Delete removes the org with its memberships, false if it does not exist
	Delete(ctx context.Context, orgID string) (bool, error)
}
