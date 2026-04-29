package jwt

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"

	"auth/internal/core/ports/driven/tools"
)

// RSA issues RS256 JWTs and JWKS documents
type RSA struct {
	privateKey *rsa.PrivateKey
	kid        string
}

// NewRSA creates a new RSA JWT issuer
func NewRSA(privateKey *rsa.PrivateKey, kid string) *RSA {
	return &RSA{
		privateKey: privateKey,
		kid:        kid,
	}
}

type header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
	Kid string `json:"kid"`
}

type payload struct {
	Sub  string              `json:"sub"`
	Iss  string              `json:"iss"`
	Aud  string              `json:"aud"`
	Iat  int64               `json:"iat"`
	Exp  int64               `json:"exp"`
	Orgs []tools.JWTOrgClaim `json:"orgs"`
}

// Issue builds and signs JWT
func (issuer *RSA) Issue(claims tools.JWTClaims) (string, error) {
	tokenHeader := header{
		Alg: "RS256",
		Typ: "JWT",
		Kid: issuer.kid,
	}

	headerBytes, err := json.Marshal(tokenHeader)

	if err != nil {
		return "", fmt.Errorf("jwt: marshal header: %w", err)
	}

	tokenPayload := payload{
		Sub:  claims.Subject,
		Iss:  claims.Issuer,
		Aud:  claims.Audience,
		Iat:  claims.IssuedAt.Unix(),
		Exp:  claims.Expiration.Unix(),
		Orgs: claims.Organizations,
	}
	if tokenPayload.Orgs == nil {
		tokenPayload.Orgs = make([]tools.JWTOrgClaim, 0)
	}

	payloadBytes, err := json.Marshal(tokenPayload)
	if err != nil {
		return "", fmt.Errorf("jwt: marshal payload: %w", err)
	}

	signingInput := base64.RawURLEncoding.EncodeToString(headerBytes) + "." +
		base64.RawURLEncoding.EncodeToString(payloadBytes)

	digest := sha256.Sum256([]byte(signingInput))
	signature, err := rsa.SignPKCS1v15(rand.Reader, issuer.privateKey, crypto.SHA256, digest[:])
	if err != nil {
		return "", fmt.Errorf("jwt: sign: %w", err)
	}

	return signingInput + "." + base64.RawURLEncoding.EncodeToString(signature), nil
}

type jwk struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type jwks struct {
	Keys []jwk `json:"keys"`
}

// JWKS returns the public JWKS
func (issuer *RSA) JWKS() ([]byte, error) {
	publicKey := issuer.privateKey.PublicKey
	exponentBytes := encodeIntBE(publicKey.E)
	doc := jwks{
		Keys: []jwk{
			{
				Kty: "RSA",
				Kid: issuer.kid,
				Use: "sig",
				Alg: "RS256",
				N:   base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes()),
				E:   base64.RawURLEncoding.EncodeToString(exponentBytes),
			},
		},
	}

	return json.Marshal(doc)
}

func encodeIntBE(n int) []byte {
	var buf [8]byte
	binary.BigEndian.PutUint64(buf[:], uint64(n))

	i := 0
	for i < 7 && buf[i] == 0 {
		i++
	}

	return buf[i:]
}

var _ tools.JWTIssuerTool = (*RSA)(nil)
