//go:build integration

package integration_test

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// TestAuth covers public /api/auth/* endpoints.
func TestAuth(t *testing.T) {
	group(t, "POST /api/auth/register", func(t *testing.T) {
		t.Run("creates a user with valid payload and returns 201 + id", func(t *testing.T) {
			client := freshClient(t)
			email := randEmail()
			beforeEvents := redisStreamLen(t, "auth:user-events")
			step(t, "registering %s", email)

			response := postJSON(t, client, authBase+"/api/auth/register", map[string]string{
				"email": email, "password": "password123", "name": "Bob", "family": "B",
			})
			defer response.Body.Close()
			responseBody := readBody(response)
			require.Equalf(t, 201, response.StatusCode, "body: %s", responseBody)

			var body struct {
				ID             string `json:"id"`
				IsInitializing bool   `json:"isInitializing"`
			}
			require.NoError(t, json.Unmarshal([]byte(responseBody), &body))
			step(t, "got user id=%s", body.ID)
			require.NotEmpty(t, body.ID)
			require.True(t, body.IsInitializing)
			require.Equal(t, beforeEvents+1, redisStreamLen(t, "auth:user-events"))
		})

		t.Run("rejects duplicate email with 409", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")
			beforeEvents := redisStreamLen(t, "auth:user-events")

			step(t, "second register with same email must conflict")
			response := postJSON(t, client, authBase+"/api/auth/register", map[string]string{
				"email": email, "password": "password123", "name": "Bob", "family": "B",
			})
			defer response.Body.Close()
			require.Equal(t, 409, response.StatusCode)
			require.Equal(t, beforeEvents, redisStreamLen(t, "auth:user-events"))
		})

		t.Run("rejects invalid payload with 400", func(t *testing.T) {
			client := freshClient(t)
			beforeEvents := redisStreamLen(t, "auth:user-events")
			step(t, "sending bad email + short password")
			response := postJSON(t, client, authBase+"/api/auth/register", map[string]string{
				"email": "not-an-email", "password": "short", "name": "", "family": "",
			})
			defer response.Body.Close()
			require.Equal(t, 400, response.StatusCode)
			require.Equal(t, beforeEvents, redisStreamLen(t, "auth:user-events"))
		})
	})

	group(t, "POST /api/auth/login", func(t *testing.T) {
		t.Run("returns 204 + HttpOnly session cookie on success", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")

			step(t, "logging in %s", email)
			response := loginUser(t, client, email, "password123")
			defer response.Body.Close()
			require.Equal(t, 204, response.StatusCode)

			var sessionCookie *http.Cookie
			for _, cookie := range response.Cookies() {
				if cookie.Name == "session" {
					sessionCookie = cookie
				}
			}
			require.NotNil(t, sessionCookie, "session cookie must be set")
			step(t, "cookie value len=%d, HttpOnly=%v, MaxAge=%d", len(sessionCookie.Value), sessionCookie.HttpOnly, sessionCookie.MaxAge)
			require.NotEmpty(t, sessionCookie.Value)
			require.True(t, sessionCookie.HttpOnly)
		})

		t.Run("returns 401 on wrong password", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")

			response := loginUser(t, client, email, "totally-wrong")
			defer response.Body.Close()
			require.Equal(t, 401, response.StatusCode)
		})

		t.Run("locks account after N failed attempts and unlocks after duration", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")

			step(t, "spamming 3 wrong passwords")
			for attemptIndex := 0; attemptIndex < 3; attemptIndex++ {
				response := loginUser(t, client, email, "wrong-password")
				require.Equalf(t, 401, response.StatusCode, "attempt %d", attemptIndex+1)
				response.Body.Close()
			}

			step(t, "next attempt must be 423 Locked")
			response := loginUser(t, client, email, "wrong-password")
			require.Equal(t, 423, response.StatusCode)
			response.Body.Close()

			step(t, "waiting 3s for lockout to expire")
			time.Sleep(3 * time.Second)

			step(t, "correct password should succeed again")
			response = loginUser(t, client, email, "password123")
			defer response.Body.Close()
			require.Equalf(t, 204, response.StatusCode, "body: %s", readBody(response))
		})
	})

	group(t, "GET /api/auth/me and POST /api/auth/logout", func(t *testing.T) {
		t.Run("returns 401 without cookie", func(t *testing.T) {
			client := freshClient(t)
			response := get(t, client, authBase+"/api/auth/me")
			defer response.Body.Close()
			require.Equal(t, 401, response.StatusCode)
		})

		t.Run("returns profile with initialization flag after login", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")
			loginResponse := loginUser(t, client, email, "password123")
			loginResponse.Body.Close()

			response := get(t, client, authBase+"/api/auth/me")
			defer response.Body.Close()
			require.Equal(t, 200, response.StatusCode)

			var body struct {
				ID             string `json:"id"`
				Email          string `json:"email"`
				Name           string `json:"name"`
				Family         string `json:"family"`
				IsInitializing bool   `json:"isInitializing"`
				Organizations  []any  `json:"organizations"`
			}
			require.NoError(t, json.NewDecoder(response.Body).Decode(&body))
			step(t, "got id=%s email=%s orgs=%d", body.ID, body.Email, len(body.Organizations))
			require.Equal(t, email, body.Email)
			require.NotEmpty(t, body.ID)
			require.True(t, body.IsInitializing)
			require.Empty(t, body.Organizations, "auth must return an empty list before server initializes orgs")
		})

		t.Run("logout clears cookie and subsequent /me returns 401", func(t *testing.T) {
			client := freshClient(t)
			email := signUpUser(t, client, "password123")
			loginResponse := loginUser(t, client, email, "password123")
			loginResponse.Body.Close()

			step(t, "calling /logout")
			logoutResponse := postJSON(t, client, authBase+"/api/auth/logout", nil)
			require.Equal(t, 204, logoutResponse.StatusCode)
			logoutResponse.Body.Close()

			step(t, "/me must now be 401")
			response := get(t, client, authBase+"/api/auth/me")
			defer response.Body.Close()
			require.Equal(t, 401, response.StatusCode)
		})
	})
}
