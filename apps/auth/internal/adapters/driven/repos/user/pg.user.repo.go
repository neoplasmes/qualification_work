package user

import (
	"context"
	"errors"
	"fmt"
	"time"

	"auth/internal/core/ports/driven/repos"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repo is a postgres-based user repository for operating with some of users data
type Repo struct {
	pool *pgxpool.Pool
}

// NewPg creates a new postgres-based user repository
func NewPg(pool *pgxpool.Pool) *Repo {
	return &Repo{
		pool: pool,
	}
}

// ExistsByEmail checks whether a user email is already taken
func (repo *Repo) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var exists bool

	err := repo.pool.QueryRow(
		ctx,
		`SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = $1)`,
		email,
	).Scan(&exists)

	if err != nil {
		return false, fmt.Errorf("pg.user.ExistsByEmail: %w", err)
	}

	return exists, nil
}

// FindCredentialsByEmail returns user credentials by email
func (repo *Repo) FindCredentialsByEmail(ctx context.Context, email string) (*repos.UserCredentials, error) {
	var credentials repos.UserCredentials
	var lockedUntil *time.Time

	err := repo.pool.QueryRow(
		ctx,
		`SELECT id, password_hash, failed_login_attempts, locked_until
		 FROM auth.users WHERE email = $1`,
		email,
	).Scan(&credentials.ID, &credentials.PasswordHash, &credentials.FailedLoginAttempts, &lockedUntil)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("pg.user.FindCredentialsByEmail: %w", err)
	}

	credentials.LockedUntil = lockedUntil

	return &credentials, nil
}

// FindProfileByID returns a public user profile by ID
func (repo *Repo) FindProfileByID(ctx context.Context, id string) (*repos.UserProfile, error) {
	var profile repos.UserProfile

	err := repo.pool.QueryRow(
		ctx,
		`SELECT id, email, name, family, is_initializing FROM auth.users WHERE id = $1`,
		id,
	).Scan(&profile.ID, &profile.Email, &profile.Name, &profile.Family, &profile.IsInitializing)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("pg.user.FindProfileByID: %w", err)
	}

	return &profile, nil
}

// Create inserts a user in database and returns its ID
func (repo *Repo) Create(ctx context.Context, params repos.UserCreateParams) (string, error) {
	var userID string

	err := repo.pool.QueryRow(
		ctx,
		`INSERT INTO auth.users (email, password_hash, name, family, is_initializing)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		params.Email, params.PasswordHash, params.Name, params.Family, params.IsInitializing,
	).Scan(&userID)

	if err != nil {
		return "", fmt.Errorf("pg.user.Create: %w", err)
	}

	return userID, nil
}

// IncrementFailedAttempts increments failures and returns the new count
func (repo *Repo) IncrementFailedAttempts(ctx context.Context, userID string) (int, error) {
	var failedAttempts int

	err := repo.pool.QueryRow(
		ctx,
		`UPDATE auth.users
		   SET failed_login_attempts = failed_login_attempts + 1
		 WHERE id = $1
		 RETURNING failed_login_attempts`,
		userID,
	).Scan(&failedAttempts)

	if err != nil {
		return 0, fmt.Errorf("pg.user.IncrementFailedAttempts: %w", err)
	}

	return failedAttempts, nil
}

// Lock sets locked_until for the user
func (repo *Repo) Lock(ctx context.Context, userID string, until time.Time) error {
	_, err := repo.pool.Exec(
		ctx,
		`UPDATE auth.users SET locked_until = $2 WHERE id = $1`,
		userID, until,
	)

	if err != nil {
		return fmt.Errorf("pg.user.Lock: %w", err)
	}

	return nil
}

// ResetFailedAttempts clears failures and lockout
func (repo *Repo) ResetFailedAttempts(ctx context.Context, userID string) error {
	_, err := repo.pool.Exec(
		ctx,
		`UPDATE auth.users
		   SET failed_login_attempts = 0, locked_until = NULL
		 WHERE id = $1`,
		userID,
	)

	if err != nil {
		return fmt.Errorf("pg.user.ResetFailedAttempts: %w", err)
	}

	return nil
}

var _ repos.UserRepo = (*Repo)(nil)
