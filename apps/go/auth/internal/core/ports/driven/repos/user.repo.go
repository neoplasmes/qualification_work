package repos

import (
	"context"
	"time"
)

// UserCreateParams contains fields required to create a user.
type UserCreateParams struct {
	Email          string
	PasswordHash   string
	Name           string
	Family         string
	IsInitializing bool
}

// UserCredentials is the projection used during sign-in.
type UserCredentials struct {
	ID                  string
	PasswordHash        string
	FailedLoginAttempts int
	LockedUntil         *time.Time
}

// UserProfile is the projection used by the profile endpoint.
type UserProfile struct {
	ID             string
	Email          string
	Name           string
	Family         string
	IsInitializing bool
}

// UserRepo stores users and login state.
type UserRepo interface {
	// ExistsByEmail checks whether a user email is already taken.
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	// FindCredentialsByEmail returns sign-in credentials by email.
	FindCredentialsByEmail(ctx context.Context, email string) (*UserCredentials, error)
	// FindProfileByID returns a public user profile by ID.
	FindProfileByID(ctx context.Context, id string) (*UserProfile, error)
	// Create inserts a user and returns its ID.
	Create(ctx context.Context, params UserCreateParams) (id string, err error)

	// IncrementFailedAttempts increments failures and returns the new count.
	IncrementFailedAttempts(ctx context.Context, userID string) (int, error)
	// Lock sets locked_until for the user.
	Lock(ctx context.Context, userID string, until time.Time) error
	// ResetFailedAttempts clears failures and lockout.
	ResetFailedAttempts(ctx context.Context, userID string) error
}

// Missing rows are represented as (nil, nil); handlers decide what nil means.
