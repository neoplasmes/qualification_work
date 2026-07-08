package tools

// TokenGeneratorTool creates session tokens
type TokenGeneratorTool interface {
	// Generate generates new session token
	Generate() (string, error)
}
