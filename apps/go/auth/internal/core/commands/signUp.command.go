package commands

import (
	"context"
	"fmt"

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
	ID string
}

// TODO: redis pub/sub task to create a new organization
// SignUpHandler registers users
type SignUpHandler struct {
	users  repos.UserRepo
	hasher tools.HasherTool
}

// NewSignUp creates a SignUpHandler
func NewSignUp(users repos.UserRepo, hasher tools.HasherTool) *SignUpHandler {
	return &SignUpHandler{
		users:  users,
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
		Email:        input.Email,
		PasswordHash: hash,
		Name:         input.Name,
		Family:       input.Family,
	})
	if err != nil {
		return emptyOutput, fmt.Errorf("signUp: create: %w", err)
	}

	return SignUpOutput{
		ID: userID,
	}, nil
}
