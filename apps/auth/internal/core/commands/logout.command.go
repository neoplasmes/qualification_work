package commands

import (
	"context"
	"fmt"

	"auth/internal/core/ports/driven/repos"
)

type LogoutInput struct {
	// Token is a session token
	Token string
}

type LogoutOutput struct{}

// LogoutHandler deletes sessions
type LogoutHandler struct {
	sessions repos.SessionRepo
}

// NewLogout creates a LogoutHandler
func NewLogout(sessions repos.SessionRepo) *LogoutHandler {
	return &LogoutHandler{
		sessions: sessions,
	}
}

// Execute deletes the session token if it exists
func (handler *LogoutHandler) Execute(ctx context.Context, input LogoutInput) (LogoutOutput, error) {
	var emptyOutput LogoutOutput

	if input.Token == "" {
		return emptyOutput, nil
	}

	if err := handler.sessions.Delete(ctx, input.Token); err != nil {
		return emptyOutput, fmt.Errorf("logout: %w", err)
	}

	return emptyOutput, nil
}
