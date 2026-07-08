package commands

import (
	"context"
	"fmt"
	"time"

	"auth/internal/core/domain"
	"auth/internal/core/ports/driven/repos"
	"auth/internal/core/ports/driven/tools"

	appErrors "auth/internal/core/errors"
)

type SignInInput struct {
	Email    string
	Password string
}

type SignInOutput struct {
	// Token is a session token
	Token string
}

type LockoutPolicy struct {
	MaxFailedAttempts int
	Duration          time.Duration
}

// SignInHandler verifies credentials and creates sessions
type SignInHandler struct {
	users    repos.UserRepo
	sessions repos.SessionRepo
	hasher   tools.HasherTool
	policy   LockoutPolicy
}

// NewSignIn creates a SignInHandler
func NewSignIn(
	users repos.UserRepo,
	sessions repos.SessionRepo,
	hasher tools.HasherTool,
	policy LockoutPolicy,
) *SignInHandler {
	return &SignInHandler{
		users:    users,
		sessions: sessions,
		hasher:   hasher,
		policy:   policy,
	}
}

// Execute verifies credentials and returns a session token
func (handler *SignInHandler) Execute(ctx context.Context, input SignInInput) (SignInOutput, error) {
	var emptyOutput SignInOutput

	credentials, err := handler.users.FindCredentialsByEmail(ctx, input.Email)
	if err != nil {
		return emptyOutput, fmt.Errorf("signIn: find creds: %w", err)
	}

	if credentials == nil {
		return emptyOutput, appErrors.Unauthorized("")
	}

	now := time.Now().UTC()
	if credentials.LockedUntil != nil && credentials.LockedUntil.After(now) {
		return emptyOutput, appErrors.Locked("account is temporarily locked")
	}

	passwordMatches, err := handler.hasher.Verify(input.Password, credentials.PasswordHash)
	if err != nil {
		return emptyOutput, fmt.Errorf("signIn: verify: %w", err)
	}

	if !passwordMatches {
		// Increment failures and lock the account if needed
		failedAttempts, err := handler.users.IncrementFailedAttempts(ctx, credentials.ID)
		if err != nil {
			return emptyOutput, fmt.Errorf("signIn: increment attempts: %w", err)
		}

		if failedAttempts >= handler.policy.MaxFailedAttempts {
			if err := handler.users.Lock(ctx, credentials.ID, now.Add(handler.policy.Duration)); err != nil {
				return emptyOutput, fmt.Errorf("signIn: lock: %w", err)
			}
		}

		return emptyOutput, appErrors.Unauthorized("")
	}

	// Successful login clears failed attempts and lockout
	if credentials.FailedLoginAttempts > 0 || credentials.LockedUntil != nil {
		if err := handler.users.ResetFailedAttempts(ctx, credentials.ID); err != nil {
			return emptyOutput, fmt.Errorf("signIn: reset attempts: %w", err)
		}
	}

	token, err := handler.sessions.Create(ctx, domain.Session{
		UserID: credentials.ID,
	})
	if err != nil {
		return emptyOutput, fmt.Errorf("signIn: create session: %w", err)
	}

	return SignInOutput{
		Token: token,
	}, nil
}
