package hasher

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"auth/internal/core/ports/driven/tools"

	"golang.org/x/crypto/argon2"
)

const (
	memoryKiB   uint32 = 32 * 1024
	timeCost    uint32 = 2
	parallelism uint8  = 1
	keyLen      uint32 = 32
	saltLen     int    = 16
)

// Argon2 hashes and unhashes passwords with Argon2id and an HMAC pepper
type Argon2 struct {
	pepper []byte
}

// NewArgon2 creates a new argon2-based password hasher
func NewArgon2(pepper string) *Argon2 {
	return &Argon2{
		pepper: []byte(pepper),
	}
}

// applyPepper applies pepper ...
func (hasher *Argon2) applyPepper(plain string) string {
	mac := hmac.New(sha256.New, hasher.pepper)
	mac.Write([]byte(plain))

	return hex.EncodeToString(mac.Sum(nil))
}

// Hash creates a hardcoded argon2id string which existance in this world i couldn't even imagine
func (hasher *Argon2) Hash(plain string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("argon2 salt: %w", err)
	}

	peppered := hasher.applyPepper(plain)
	key := argon2.IDKey([]byte(peppered), salt, timeCost, memoryKiB, parallelism, keyLen)

	return fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, memoryKiB, timeCost, parallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	), nil
}

// Verify verifies raw password
func (hasher *Argon2) Verify(plain, hashed string) (bool, error) {
	parts := strings.Split(hashed, "$")

	// Format: ["", "argon2id", "v=N", "m=...,t=...,p=...", "<salt>", "<hash>"]
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false, errors.New("argon2: bad hash format")
	}

	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return false, fmt.Errorf("argon2: parse version: %w", err)
	}

	var memory uint32
	var timeCostFromHash uint32
	var parallelismFromHash uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &timeCostFromHash, &parallelismFromHash); err != nil {
		return false, fmt.Errorf("argon2: parse params: %w", err)
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, fmt.Errorf("argon2: decode salt: %w", err)
	}

	expected, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, fmt.Errorf("argon2: decode key: %w", err)
	}

	peppered := hasher.applyPepper(plain)
	got := argon2.IDKey([]byte(peppered), salt, timeCostFromHash, memory, parallelismFromHash, uint32(len(expected)))

	return subtle.ConstantTimeCompare(got, expected) == 1, nil
}

var _ tools.HasherTool = (*Argon2)(nil)