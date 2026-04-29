package domain

import "time"

// User is a copy of a user row from auth.users, but actually it is a clear domain
type User struct {
	ID                  string
	Email               string
	PasswordHash        string
	FailedLoginAttempts int
	LockedUntil         *time.Time
	Name                string
	Family              string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}
