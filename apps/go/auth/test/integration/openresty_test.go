//go:build integration

package integration_test

import (
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// TestOpenResty covers the gateway auth_request flow.
func TestOpenResty(t *testing.T) {
	group(t, "protected /api/* through OpenResty", func(t *testing.T) {
		t.Run("gateway returns 401 without a session cookie", func(t *testing.T) {
			bareClient := &http.Client{
				Timeout: 5 * time.Second,
			}
			step(t, "GET %s/api/anything without cookie", gatewayBase)
			response := get(t, bareClient, gatewayBase+"/api/anything")
			defer response.Body.Close()
			require.Equal(t, 401, response.StatusCode)
		})

		t.Run("gateway forwards a valid cookie request with X-Internal-Auth", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")

			step(t, "login through gateway")
			loginResponse := postJSON(t, client, gatewayBase+"/api/auth/login", map[string]string{
				"email": email, "password": "password123",
			})
			require.Equal(t, 204, loginResponse.StatusCode)
			loginResponse.Body.Close()

			step(t, "GET /api/anything - whoami echoes headers in body")
			response := get(t, client, gatewayBase+"/api/anything")
			defer response.Body.Close()
			require.Equal(t, 200, response.StatusCode)

			body, _ := io.ReadAll(response.Body)
			require.Contains(t, string(body), "X-Internal-Auth: ey",
				"openresty must pass X-Internal-Auth with JWT downstream")

			token := extractInternalAuth(string(body))
			step(t, "downstream received JWT (len=%d), verifying signature", len(token))
			privateKey := loadPrivateKey(t)
			claims := verifyJWT(t, token, &privateKey.PublicKey)
			require.NotEmpty(t, claims.Sub)
		})

		t.Run("second request with same cookie gets HIT from proxy_cache", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")
			markUserInitialized(t, email)
			loginResponse := postJSON(t, client, gatewayBase+"/api/auth/login", map[string]string{
				"email": email, "password": "password123",
			})
			require.Equal(t, 204, loginResponse.StatusCode)
			loginResponse.Body.Close()

			step(t, "first request - expecting MISS")
			firstResponse := get(t, client, gatewayBase+"/api/anything")
			firstResponse.Body.Close()
			require.Equal(t, 200, firstResponse.StatusCode)
			firstCacheStatus := firstResponse.Header.Get("X-Auth-Cache")
			step(t, "X-Auth-Cache=%s", firstCacheStatus)

			require.NotEqual(t, "HIT", firstCacheStatus)

			step(t, "second request - expecting HIT")
			secondResponse := get(t, client, gatewayBase+"/api/anything")
			defer secondResponse.Body.Close()
			require.Equal(t, 200, secondResponse.StatusCode)
			secondCacheStatus := secondResponse.Header.Get("X-Auth-Cache")
			step(t, "X-Auth-Cache=%s", secondCacheStatus)
			require.Equal(t, "HIT", secondCacheStatus, "repeat request must reuse JWT from OpenResty cache")
		})

		t.Run("initializing users are not cached by proxy_cache", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")
			loginResponse := postJSON(t, client, gatewayBase+"/api/auth/login", map[string]string{
				"email": email, "password": "password123",
			})
			require.Equal(t, 204, loginResponse.StatusCode)
			loginResponse.Body.Close()

			firstResponse := get(t, client, gatewayBase+"/api/anything")
			firstResponse.Body.Close()
			require.Equal(t, 200, firstResponse.StatusCode)

			secondResponse := get(t, client, gatewayBase+"/api/anything")
			defer secondResponse.Body.Close()
			require.Equal(t, 200, secondResponse.StatusCode)
			require.NotEqual(t, "HIT", secondResponse.Header.Get("X-Auth-Cache"))
		})

		t.Run("public /api/auth/* is served without auth_request", func(t *testing.T) {
			bareClient := &http.Client{
				Timeout: 5 * time.Second,
			}
			step(t, "registration through OpenResty without cookie must work")
			response := postJSON(t, bareClient, gatewayBase+"/api/auth/register", map[string]string{
				"email": randEmail(), "password": "password123", "name": "Via", "family": "Gateway",
			})
			defer response.Body.Close()
			require.Equalf(t, 201, response.StatusCode, "body: %s", strings.TrimSpace(readBody(response)))
		})
	})
}
