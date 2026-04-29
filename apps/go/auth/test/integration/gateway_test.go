//go:build integration

package integration_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// TestGateway covers internal /gateway/* endpoints.
func TestGateway(t *testing.T) {
	group(t, "GET /gateway/jwt", func(t *testing.T) {
		t.Run("issues RS256-JWT signed by configured private key", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")
			loginResponse := loginUser(t, client, email, "password123")
			loginResponse.Body.Close()

			step(t, "asking auth for internal JWT")
			response := get(t, client, authBase+"/gateway/jwt")
			defer response.Body.Close()
			require.Equal(t, 204, response.StatusCode)

			token := response.Header.Get("X-Internal-Auth")
			step(t, "got jwt (len=%d)", len(token))
			require.NotEmpty(t, token)

			step(t, "verifying signature with public key from test/integration/keys/jwt.pem")
			privateKey := loadPrivateKey(t)
			claims := verifyJWT(t, token, &privateKey.PublicKey)

			require.NotEmpty(t, claims.Sub)
			require.Equal(t, "qualification-auth-test", claims.Iss)
			require.Equal(t, "internal", claims.Aud)
			require.Greater(t, claims.Exp, time.Now().Unix(), "exp must be in the future")
		})

		t.Run("returns 401 without cookie", func(t *testing.T) {
			client := freshClient(t)
			response := get(t, client, authBase+"/gateway/jwt")
			defer response.Body.Close()
			require.Equal(t, 401, response.StatusCode)
		})
	})

	group(t, "GET /gateway/.well-known/jwks.json", func(t *testing.T) {
		t.Run("returns a valid JWKS document with one RSA key", func(t *testing.T) {
			client := freshClient(t)
			response := get(t, client, authBase+"/gateway/.well-known/jwks.json")
			defer response.Body.Close()
			require.Equal(t, 200, response.StatusCode)

			var body struct {
				Keys []struct {
					Kty, Kid, Use, Alg, N, E string
				}
			}
			require.NoError(t, json.NewDecoder(response.Body).Decode(&body))
			step(t, "jwks has %d keys", len(body.Keys))
			require.Len(t, body.Keys, 1)
			require.Equal(t, "RSA", body.Keys[0].Kty)
			require.Equal(t, "RS256", body.Keys[0].Alg)
			require.Equal(t, "sig", body.Keys[0].Use)
			require.NotEmpty(t, body.Keys[0].N)
			require.NotEmpty(t, body.Keys[0].E)
		})
	})
}
