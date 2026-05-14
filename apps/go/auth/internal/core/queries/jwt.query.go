package queries

import (
	"context"
	"fmt"
	"time"

	"auth/internal/core/ports/driven/repos"
	"auth/internal/core/ports/driven/tools"

	appErrors "auth/internal/core/errors"
)

type JWTInput struct {
	Token string
}

type JWTOutput struct {
	JWT            string
	IsInitializing bool
}

type JWTIssuerPolicy struct {
	Issuer   string
	Audience string
	TTL      time.Duration
}

// JWTHandler issues internal JWTs
type JWTHandler struct {
	sessions repos.SessionRepo
	users    repos.UserRepo
	orgs     repos.OrgRepo
	issuer   tools.JWTIssuerTool
	policy   JWTIssuerPolicy
}

// NewJWT creates a JWTHandler
func NewJWT(
	sessions repos.SessionRepo,
	users repos.UserRepo,
	orgs repos.OrgRepo,
	issuer tools.JWTIssuerTool,
	policy JWTIssuerPolicy,
) *JWTHandler {
	return &JWTHandler{
		sessions: sessions,
		users:    users,
		orgs:     orgs,
		issuer:   issuer,
		policy:   policy,
	}
}

// Execute validates the session and issues an internal JWT for other microservices to use
func (handler *JWTHandler) Execute(ctx context.Context, input JWTInput) (JWTOutput, error) {
	var emptyOutput JWTOutput

	if input.Token == "" {
		return emptyOutput, appErrors.Unauthorized("")
	}

	session, err := handler.sessions.Find(ctx, input.Token)
	if err != nil {
		return emptyOutput, fmt.Errorf("jwt: find session: %w", err)
	}
	if session == nil {
		return emptyOutput, appErrors.Unauthorized("")
	}

	profile, err := handler.users.FindProfileByID(ctx, session.UserID)
	if err != nil {
		return emptyOutput, fmt.Errorf("jwt: find profile: %w", err)
	}
	if profile == nil {
		return emptyOutput, appErrors.Unauthorized("")
	}

	memberships, err := handler.orgs.FindByUserID(ctx, session.UserID)
	if err != nil {
		return emptyOutput, fmt.Errorf("jwt: find orgs: %w", err)
	}

	orgClaims := make([]tools.JWTOrgClaim, 0, len(memberships))
	for _, membership := range memberships {
		orgClaims = append(orgClaims, tools.JWTOrgClaim{
			ID:   membership.OrgID,
			Role: string(membership.Role),
		})
	}

	now := time.Now().UTC()
	token, err := handler.issuer.Issue(tools.JWTClaims{
		Subject:       session.UserID,
		Issuer:        handler.policy.Issuer,
		Audience:      handler.policy.Audience,
		IssuedAt:      now,
		Expiration:    now.Add(handler.policy.TTL),
		Organizations: orgClaims,
	})
	if err != nil {
		return emptyOutput, fmt.Errorf("jwt: issue: %w", err)
	}

	return JWTOutput{
		JWT:            token,
		IsInitializing: profile.IsInitializing,
	}, nil
}
