package commands

import (
	"context"
	"fmt"

	"auth/internal/core/domain"
	"auth/internal/core/ports/driven/repos"

	appErrors "auth/internal/core/errors"
)

type DeleteOrgInput struct {
	Token string
	OrgID string
}

// DeleteOrgHandler deletes an org, only its owner is allowed to
type DeleteOrgHandler struct {
	sessions repos.SessionRepo
	orgs     repos.OrgRepo
}

// NewDeleteOrg creates a DeleteOrgHandler
func NewDeleteOrg(sessions repos.SessionRepo, orgs repos.OrgRepo) *DeleteOrgHandler {
	return &DeleteOrgHandler{
		sessions: sessions,
		orgs:     orgs,
	}
}

// Execute deletes the org, other services clean their data on OrgDeleted
func (handler *DeleteOrgHandler) Execute(ctx context.Context, input DeleteOrgInput) error {
	session, err := handler.sessions.Find(ctx, input.Token)
	if err != nil {
		return fmt.Errorf("deleteOrg: find session: %w", err)
	}
	if session == nil {
		return appErrors.Unauthorized("")
	}

	role, err := handler.orgs.FindRole(ctx, input.OrgID, session.UserID)
	if err != nil {
		return fmt.Errorf("deleteOrg: find role: %w", err)
	}
	// non members must not learn whether the org exists
	if role == "" {
		return appErrors.NotFound("organization not found")
	}
	if role != domain.OrgRoleOwner {
		return appErrors.New(appErrors.ErrorTypeForbidden, "only the owner can delete the organization")
	}

	deleted, err := handler.orgs.Delete(ctx, input.OrgID)
	if err != nil {
		return fmt.Errorf("deleteOrg: %w", err)
	}
	if !deleted {
		return appErrors.NotFound("organization not found")
	}

	return nil
}
