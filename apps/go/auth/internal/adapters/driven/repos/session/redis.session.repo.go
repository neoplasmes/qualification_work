package session

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"auth/internal/core/domain"
	"auth/internal/core/ports/driven/repos"
	"auth/internal/core/ports/driven/tools"

	"github.com/redis/go-redis/v9"
)

// TODO: redis session right now is just a UUID, so probably it is also a bad design???
// Repo stores sessions in Redis
type Repo struct {
	client *redis.Client
	tokens tools.TokenGeneratorTool
	ttl    time.Duration
}

// NewRedis creates a new redis-based session repository
func NewRedis(client *redis.Client, tokens tools.TokenGeneratorTool, ttl time.Duration) *Repo {
	return &Repo{
		client: client,
		tokens: tokens,
		ttl:    ttl,
	}
}

type sessionPayload struct {
	UserID string `json:"userId"`
}

// Create stores a session and returns its token
func (repo *Repo) Create(ctx context.Context, session domain.Session) (string, error) {
	token, err := repo.tokens.Generate()
	if err != nil {
		return "", fmt.Errorf("redis.session.Create token: %w", err)
	}

	rawPayload, err := json.Marshal(sessionPayload{
		UserID: session.UserID,
	})
	if err != nil {
		return "", fmt.Errorf("redis.session.Create marshal: %w", err)
	}

	if err := repo.client.Set(ctx, key(token), rawPayload, repo.ttl).Err(); err != nil {
		return "", fmt.Errorf("redis.session.Create set: %w", err)
	}

	return token, nil
}

// Find returns a session by token or nil if not found
func (repo *Repo) Find(ctx context.Context, token string) (*domain.Session, error) {
	rawPayload, err := repo.client.Get(ctx, key(token)).Result()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("redis.session.Find: %w", err)
	}

	var payload sessionPayload
	if err := json.Unmarshal([]byte(rawPayload), &payload); err != nil {
		return nil, fmt.Errorf("redis.session.Find unmarshal: %w", err)
	}

	return &domain.Session{
		UserID: payload.UserID,
	}, nil
}

// Delete removes a session idempotently
func (repo *Repo) Delete(ctx context.Context, token string) error {
	if err := repo.client.Del(ctx, key(token)).Err(); err != nil {
		return fmt.Errorf("redis.session.Delete: %w", err)
	}

	return nil
}

func key(token string) string {
	return "session:" + token
}

var _ repos.SessionRepo = (*Repo)(nil)
