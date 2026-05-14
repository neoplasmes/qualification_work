package tokenGenerator

import (
	"auth/internal/core/ports/driven/tools"

	"github.com/google/uuid"
)

// UUID generates UUIDv4 session tokens
type UUID struct{}

// NewUUID creates a UUID token generator
func NewUUID() *UUID {
	return new(UUID)
}

// Generate returns a new UUIDv4 token
func (UUID) Generate() (string, error) {
	return uuid.NewString(), nil
}

var _ tools.TokenGeneratorTool = (*UUID)(nil)
