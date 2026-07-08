//go:build integration

package integration_test

import (
	"bytes"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

var (
	authBase    = envOr("AUTH_BASE", "http://localhost:13002")
	gatewayBase = envOr("GATEWAY_BASE", "http://localhost:18080")
	keyPath     = envOr("AUTH_TEST_KEY", "keys/jwt.pem")
	redisAddr   = envOr("AUTH_TEST_REDIS_ADDR", "localhost:16379")
	pgURL       = envOr("AUTH_TEST_DATABASE_URL", "postgres://admin:test_password@localhost:16432/qualification_test?sslmode=disable&default_query_exec_mode=simple_protocol")
)

func envOr(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return defaultValue
}

// TestMain waits for auth before running integration tests.
func TestMain(testMain *testing.M) {
	if err := waitReady(30 * time.Second); err != nil {
		fmt.Fprintf(os.Stderr, "\nauth stack is not ready: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("auth stack ready, running tests")
	os.Exit(testMain.Run())
}

func waitReady(duration time.Duration) error {
	deadline := time.Now().Add(duration)
	for time.Now().Before(deadline) {
		response, err := http.Get(authBase + "/health")
		if err == nil {
			response.Body.Close()
			if response.StatusCode == 200 {
				return nil
			}
		}

		time.Sleep(500 * time.Millisecond)
	}

	return fmt.Errorf("timeout waiting %s/health", authBase)
}

// group is a vitest-style "describe" helper
func group(t *testing.T, name string, fn func(t *testing.T)) {
	t.Helper()
	t.Run(name, func(t *testing.T) {
		t.Logf("▸ %s", name)
		fn(t)
	})
}

// step logs a readable integration-test step (just a test-logger actually)
func step(t *testing.T, format string, args ...any) {
	t.Helper()
	t.Logf("  · "+format, args...)
}

// ——————————————————————————— Setup helpers ——————————————————————————————

func freshClient(t *testing.T) *http.Client {
	t.Helper()
	jar, err := cookiejar.New(nil)
	require.NoError(t, err, "create cookie jar")

	return &http.Client{
		Jar:     jar,
		Timeout: 5 * time.Second,
	}
}

func randEmail() string {
	return fmt.Sprintf("u%d@test.local", time.Now().UnixNano())
}

func postJSON(t *testing.T, client *http.Client, url string, body any) *http.Response {
	t.Helper()
	requestBody, err := json.Marshal(body)
	require.NoError(t, err, "marshal request body")
	request, err := http.NewRequest("POST", url, bytes.NewReader(requestBody))
	require.NoError(t, err, "build request")
	request.Header.Set("Content-Type", "application/json")
	response, err := client.Do(request)
	require.NoError(t, err, "POST %s", url)

	return response
}

func get(t *testing.T, client *http.Client, url string) *http.Response {
	t.Helper()
	request, err := http.NewRequest("GET", url, nil)
	require.NoError(t, err, "build request")
	response, err := client.Do(request)
	require.NoError(t, err, "GET %s", url)

	return response
}

func readBody(response *http.Response) string {
	bodyBytes, _ := io.ReadAll(response.Body)

	return string(bodyBytes)
}

func freshRedis(t *testing.T) *redis.Client {
	t.Helper()
	db, err := strconv.Atoi(envOr("AUTH_TEST_REDIS_DB", "0"))
	require.NoError(t, err, "parse redis db")

	client := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: envOr("AUTH_TEST_REDIS_PASSWORD", "test_password"),
		DB:       db,
	})
	require.NoError(t, client.Ping(t.Context()).Err(), "ping redis")

	return client
}

func redisStreamLen(t *testing.T, stream string) int64 {
	t.Helper()
	client := freshRedis(t)
	defer client.Close()

	length, err := client.XLen(t.Context(), stream).Result()
	require.NoError(t, err, "xlen %s", stream)

	return length
}

func markUserInitialized(t *testing.T, email string) {
	t.Helper()
	pool, err := pgxpool.New(t.Context(), pgURL)
	require.NoError(t, err, "connect postgres")
	defer pool.Close()

	tag, err := pool.Exec(t.Context(), `UPDATE auth.users SET is_initializing = false WHERE email = $1`, email)
	require.NoError(t, err, "mark user initialized")
	require.Equal(t, int64(1), tag.RowsAffected())
}

// ————————————————————————————— API helpers ——————————————————————————————————

func signUpUser(t *testing.T, client *http.Client, password string) string {
	t.Helper()
	email := randEmail()
	response := postJSON(t, client, authBase+"/api/auth/register", map[string]string{
		"email": email, "password": password, "name": "Alice", "family": "Test",
	})
	defer response.Body.Close()
	require.Equalf(t, 201, response.StatusCode, "register failed: %s", readBody(response))
	step(t, "signed up %s", email)

	return email
}

func loginUser(t *testing.T, client *http.Client, email, password string) *http.Response {
	t.Helper()
	return postJSON(t, client, authBase+"/api/auth/login", map[string]string{
		"email": email, "password": password,
	})
}

// ———————————————————————————————————— JWT helpers ————————————————————————————————

func loadPrivateKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	rawKey, err := os.ReadFile(keyPath)
	require.NoError(t, err, "read RSA key %s", keyPath)
	block, _ := pem.Decode(rawKey)
	require.NotNil(t, block, "PEM decode")
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	require.NoError(t, err, "parse private key")

	return parsed.(*rsa.PrivateKey)
}

type jwtClaims struct {
	Sub  string `json:"sub"`
	Iss  string `json:"iss"`
	Aud  string `json:"aud"`
	Exp  int64  `json:"exp"`
	Iat  int64  `json:"iat"`
	Orgs []any  `json:"orgs"`
}

func verifyJWT(t *testing.T, token string, publicKey *rsa.PublicKey) jwtClaims {
	t.Helper()
	parts := strings.Split(token, ".")
	require.Lenf(t, parts, 3, "jwt must have 3 parts, got %d", len(parts))

	signingInput := parts[0] + "." + parts[1]
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	require.NoError(t, err, "decode signature")
	digest := sha256.Sum256([]byte(signingInput))
	require.NoError(t, rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, digest[:], signature), "RSA signature must verify")

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	require.NoError(t, err, "decode payload")

	var claims jwtClaims
	require.NoError(t, json.Unmarshal(payload, &claims), "unmarshal claims")

	return claims
}

func extractInternalAuth(body string) string {
	for _, line := range strings.Split(body, "\n") {
		if strings.HasPrefix(line, "X-Internal-Auth:") {
			return strings.TrimSpace(strings.TrimPrefix(line, "X-Internal-Auth:"))
		}
	}
	return ""
}
