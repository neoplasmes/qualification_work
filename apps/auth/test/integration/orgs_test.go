//go:build integration

package integration_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func deleteOrg(t *testing.T, client *http.Client, orgID string) *http.Response {
	t.Helper()
	request, err := http.NewRequest("DELETE", authBase+"/api/orgs/"+orgID, nil)
	require.NoError(t, err, "build request")
	response, err := client.Do(request)
	require.NoError(t, err, "DELETE org")

	return response
}

func loggedInClient(t *testing.T) *http.Client {
	t.Helper()
	client := freshClient(t)
	email := signUpUser(t, client, "password123")
	loginResponse := loginUser(t, client, email, "password123")
	loginResponse.Body.Close()

	return client
}

// TestOrgs covers /api/orgs owned by auth
func TestOrgs(t *testing.T) {
	group(t, "POST and DELETE /api/orgs", func(t *testing.T) {
		t.Run("owner creates and deletes an org, both emit events", func(t *testing.T) {
			client := loggedInClient(t)
			createdBefore := orgEventCount(t, "OrgCreated")
			deletedBefore := orgEventCount(t, "OrgDeleted")

			response := postJSON(t, client, authBase+"/api/orgs", map[string]string{
				"name": randEmail(), "displayName": "Acme",
			})
			defer response.Body.Close()
			require.Equal(t, 201, response.StatusCode)

			var body struct {
				ID string `json:"id"`
			}
			require.NoError(t, json.NewDecoder(response.Body).Decode(&body))
			require.Equal(t, createdBefore+1, orgEventCount(t, "OrgCreated"))

			deleteResponse := deleteOrg(t, client, body.ID)
			deleteResponse.Body.Close()
			require.Equal(t, 204, deleteResponse.StatusCode)
			require.Equal(t, deletedBefore+1, orgEventCount(t, "OrgDeleted"))
		})

		t.Run("hides foreign orgs behind 404", func(t *testing.T) {
			owner := loggedInClient(t)
			response := postJSON(t, owner, authBase+"/api/orgs", map[string]string{
				"name": randEmail(), "displayName": "Private",
			})
			defer response.Body.Close()

			var body struct {
				ID string `json:"id"`
			}
			require.NoError(t, json.NewDecoder(response.Body).Decode(&body))

			deleteResponse := deleteOrg(t, loggedInClient(t), body.ID)
			deleteResponse.Body.Close()
			require.Equal(t, 404, deleteResponse.StatusCode)
		})

		t.Run("rejects duplicate names with 409", func(t *testing.T) {
			client := loggedInClient(t)
			name := randEmail()
			first := postJSON(t, client, authBase+"/api/orgs", map[string]string{"name": name, "displayName": "A"})
			first.Body.Close()
			second := postJSON(t, client, authBase+"/api/orgs", map[string]string{"name": name, "displayName": "B"})
			second.Body.Close()
			require.Equal(t, 409, second.StatusCode)
		})

		t.Run("returns 401 without session", func(t *testing.T) {
			response := postJSON(t, freshClient(t), authBase+"/api/orgs", map[string]string{"name": "x", "displayName": "x"})
			response.Body.Close()
			require.Equal(t, 401, response.StatusCode)
		})
	})
}
