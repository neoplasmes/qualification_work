package commands

import (
	"context"
	"fmt"

	"auth/internal/core/ports/driven/repos"

	appErrors "auth/internal/core/errors"
)

type CreateOrgInput struct {
	Token       string
	Name        string
	DisplayName string
}

// CreateOrgHandler creates an org owned by the session user
type CreateOrgHandler struct {
	sessions repos.SessionRepo
	orgs     repos.OrgRepo
}

// NewCreateOrg creates a CreateOrgHandler
func NewCreateOrg(sessions repos.SessionRepo, orgs repos.OrgRepo) *CreateOrgHandler {
	return &CreateOrgHandler{
		sessions: sessions,
		orgs:     orgs,
	}
}

// Execute creates the org and returns its ID
func (handler *CreateOrgHandler) Execute(ctx context.Context, input CreateOrgInput) (string, error) {
	session, err := handler.sessions.Find(ctx, input.Token)
	if err != nil {
		return "", fmt.Errorf("createOrg: find session: %w", err)
	}
	if session == nil {
		return "", appErrors.Unauthorized("")
	}

	orgID, err := handler.orgs.Create(ctx, repos.OrgCreateParams{
		Name:        input.Name,
		DisplayName: input.DisplayName,
		OwnerID:     session.UserID,
	})
	if err != nil {
		return "", fmt.Errorf("createOrg: %w", err)
	}

	return orgID, nil
}
