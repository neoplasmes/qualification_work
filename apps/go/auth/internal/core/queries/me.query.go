package queries

import (
	"context"
	"fmt"

	"auth/internal/core/domain"
	"auth/internal/core/ports/driven/repos"

	appErrors "auth/internal/core/errors"
)

type MeInput struct {
	Token string
}

type MeOrgMemberships struct {
	ID   string
	Name string
	Role domain.OrgRole
}

type MeOutput struct {
	ID             string
	Email          string
	Name           string
	Family         string
	IsInitializing bool
	Orgs           []MeOrgMemberships
}

// MeHandler returns the current user profile and memberships
type MeHandler struct {
	sessions repos.SessionRepo
	users    repos.UserRepo
	orgs     repos.OrgRepo
}

// NewMe creates a MeHandler
func NewMe(sessions repos.SessionRepo, users repos.UserRepo, orgs repos.OrgRepo) *MeHandler {
	return &MeHandler{
		sessions: sessions,
		users:    users,
		orgs:     orgs,
	}
}

// Execute loads the profile for the current session
func (handler *MeHandler) Execute(ctx context.Context, input MeInput) (MeOutput, error) {
	var emptyOutput MeOutput

	if input.Token == "" {
		return emptyOutput, appErrors.Unauthorized("")
	}

	session, err := handler.sessions.Find(ctx, input.Token)
	if err != nil {
		return emptyOutput, fmt.Errorf("me: find session: %w", err)
	}
	if session == nil {
		return emptyOutput, appErrors.Unauthorized("")
	}

	profile, err := handler.users.FindProfileByID(ctx, session.UserID)
	if err != nil {
		return emptyOutput, fmt.Errorf("me: find profile: %w", err)
	}
	if profile == nil {
		// The session is valid, but the user was removed
		return emptyOutput, appErrors.Unauthorized("")
	}

	memberships, err := handler.orgs.FindByUserID(ctx, session.UserID)
	if err != nil {
		return emptyOutput, fmt.Errorf("me: find orgs: %w", err)
	}

	normalizedMemberships := make([]MeOrgMemberships, 0, len(memberships))
	for _, membership := range memberships {
		normalizedMemberships = append(normalizedMemberships, MeOrgMemberships{
			ID:   membership.OrgID,
			Name: membership.Name,
			Role: membership.Role,
		})
	}

	return MeOutput{
		ID:             profile.ID,
		Email:          profile.Email,
		Name:           profile.Name,
		Family:         profile.Family,
		IsInitializing: profile.IsInitializing,
		Orgs:           normalizedMemberships,
	}, nil
}
