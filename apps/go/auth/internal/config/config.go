package config

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Port        int    `envconfig:"AUTH_PORT" default:"3002"`
	LogLevel    string `envconfig:"AUTH_LOG_LEVEL" default:"info"`
	CORSEnabled bool   `envconfig:"AUTH_CORS_ENABLED" default:"false"`

	DatabaseURL string `envconfig:"DATABASE_URL" required:"true"`
	Redis       Redis

	Pepper string `envconfig:"AUTH_PEPPER" required:"true"`

	Session     Session
	Cookie      Cookie
	Lockout     Lockout
	InternalJWT InternalJWT
}

// Redis contains Redis connection settings.
type Redis struct {
	Host     string `envconfig:"REDIS_HOST" required:"true"`
	Port     int    `envconfig:"REDIS_PORT" default:"6379"`
	Password string `envconfig:"REDIS_PASSWORD" default:""`
	DB       int    `envconfig:"REDIS_DB" default:"0"`
}

type Session struct {
	TTL time.Duration
}

type Cookie struct {
	Name     string
	Secure   bool   `envconfig:"AUTH_COOKIE_SECURE" default:"true"`
	SameSite string
	Path     string
	Domain   string
}

type Lockout struct {
	MaxFailedAttempts int           `envconfig:"AUTH_MAX_FAILED_ATTEMPTS" default:"5"`
	Duration          time.Duration `envconfig:"AUTH_LOCKOUT_DURATION" default:"15m"`
}

type InternalJWT struct {
	PrivateKeyPath string        `envconfig:"AUTH_JWT_PRIVATE_KEY_PATH" required:"true"`
	KID            string        `envconfig:"AUTH_JWT_KID" required:"true"`
	Issuer         string        `envconfig:"AUTH_JWT_ISSUER" default:"qualification-auth"`
	Audience       string        `envconfig:"AUTH_JWT_AUDIENCE" default:"internal"`
	TTL            time.Duration `envconfig:"AUTH_INTERNAL_JWT_TTL" default:"60s"`
}

func Load() (*Config, error) {
	var cfg Config

	if err := envconfig.Process("", &cfg); err != nil {
		return nil, fmt.Errorf("parse env: %w", err)
	}

	cfg.Session = Session{TTL: 168 * time.Hour}
	cfg.Cookie.Name = "session"
	cfg.Cookie.SameSite = "Strict"
	cfg.Cookie.Path = "/"

	return &cfg, nil
}

func (cookieConfig Cookie) SameSiteMode() http.SameSite {
	switch cookieConfig.SameSite {
	case "Lax":
		return http.SameSiteLaxMode
	case "None":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteStrictMode
	}
}

// LoadRSAPrivateKey loads the RSA private key from the configured file path in a terrible way
func (cfg *Config) LoadRSAPrivateKey() (*rsa.PrivateKey, error) {
	raw, err := os.ReadFile(cfg.InternalJWT.PrivateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("read private key file: %w", err)
	}

	block, _ := pem.Decode(raw)
	if block == nil {
		return nil, errors.New("private key: invalid PEM")
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}

	key, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("private key is not RSA")
	}

	return key, nil
}
