package tools

import "time"

// JWTClaims contains a concrete data signed into an internal JWT
type JWTClaims struct {
	Subject       string        // sub - user ID
	Issuer        string        // iss
	Audience      string        // aud
	IssuedAt      time.Time     // iat
	Expiration    time.Time     // exp
	Organizations []JWTOrgClaim // orgs
}

// JWTOrgClaim describes organization memberships of a user
type JWTOrgClaim struct {
	ID   string `json:"id"`
	Role string `json:"role"`
}

// JWTIssuerTool signs JWT and exposes JWKS
type JWTIssuerTool interface {
	// Issue writes claims and returns a compact JWT
	Issue(claims JWTClaims) (string, error)
	// JWKS returns the public key set as JSON bytes
	JWKS() ([]byte, error)
}
