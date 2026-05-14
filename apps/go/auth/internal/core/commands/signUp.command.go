package commands

import (
	"context"
	"fmt"
	"time"

	"auth/internal/core/ports/driven/repos"
	"auth/internal/core/ports/driven/tools"

	appErrors "auth/internal/core/errors"
)

type SignUpInput struct {
	Email    string
	Password string
	Name     string
	Family   string
}

type SignUpOutput struct {
	ID             string
	IsInitializing bool
}

// SignUpHandler registers users
type SignUpHandler struct {
	users  repos.UserRepo
	events repos.EventPublisher
	hasher tools.HasherTool
}

// NewSignUp creates a SignUpHandler
func NewSignUp(
	users repos.UserRepo,
	events repos.EventPublisher,
	hasher tools.HasherTool,
) *SignUpHandler {
	return &SignUpHandler{
		users:  users,
		events: events,
		hasher: hasher,
	}
}

// Execute creates a new user account
func (handler *SignUpHandler) Execute(ctx context.Context, input SignUpInput) (SignUpOutput, error) {
	var emptyOutput SignUpOutput

	exists, err := handler.users.ExistsByEmail(ctx, input.Email)
	if err != nil {
		return emptyOutput, fmt.Errorf("signUp: check email: %w", err)
	}

	if exists {
		return emptyOutput, appErrors.Conflict("email already in use")
	}

	hash, err := handler.hasher.Hash(input.Password)
	if err != nil {
		return emptyOutput, fmt.Errorf("signUp: hash: %w", err)
	}

	userID, err := handler.users.Create(ctx, repos.UserCreateParams{
		Email:          input.Email,
		PasswordHash:   hash,
		Name:           input.Name,
		Family:         input.Family,
		IsInitializing: true,
	})
	if err != nil {
		return emptyOutput, fmt.Errorf("signUp: create: %w", err)
	}

	if err := handler.events.PublishUserRegistered(ctx, repos.UserRegisteredEvent{
		UserID:     userID,
		Username:   input.Name,
		OccurredAt: time.Now().UTC(),
	}); err != nil {
		fmt.Printf("signUp: publish user registered: %v\n", err)
	}

	return SignUpOutput{
		ID:             userID,
		IsInitializing: true,
	}, nil
}
