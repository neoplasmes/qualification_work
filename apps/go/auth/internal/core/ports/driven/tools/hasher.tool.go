package tools

// HasherTool hashes and verifies passwords
type HasherTool interface {
	// Hash creates a password hash from plain text
	Hash(plain string) (string, error)
	// Verify checks whether plain text matches the stored hash
	Verify(plain, hashed string) (bool, error)
}
