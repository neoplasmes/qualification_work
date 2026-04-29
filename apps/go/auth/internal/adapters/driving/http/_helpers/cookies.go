package helpers

import (
	"net/http"
	"time"

	"auth/internal/config"

	"github.com/gin-gonic/gin"
)

// CookieWriter writes and reads the session cookie
type CookieWriter struct {
	cookieConfig config.Cookie
	ttl          time.Duration
}

// NewCookieWriter creates a new cookie writer with config provided
func NewCookieWriter(cookieConfig config.Cookie, ttl time.Duration) *CookieWriter {
	return &CookieWriter{
		cookieConfig: cookieConfig,
		ttl:          ttl,
	}
}

// Set writes a session token cookie
func (writer *CookieWriter) Set(ctx *gin.Context, value string) {
	ctx.SetSameSite(writer.cookieConfig.SameSiteMode())
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     writer.cookieConfig.Name,
		Value:    value,
		Path:     writer.cookieConfig.Path,
		Domain:   writer.cookieConfig.Domain,
		MaxAge:   int(writer.ttl.Seconds()),
		Secure:   writer.cookieConfig.Secure,
		HttpOnly: true,
		SameSite: writer.cookieConfig.SameSiteMode(),
	})
}

// Clear clears the session cookie
func (writer *CookieWriter) Clear(ctx *gin.Context) {
	ctx.SetSameSite(writer.cookieConfig.SameSiteMode())
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     writer.cookieConfig.Name,
		Value:    "",
		Path:     writer.cookieConfig.Path,
		Domain:   writer.cookieConfig.Domain,
		MaxAge:   -1,
		Secure:   writer.cookieConfig.Secure,
		HttpOnly: true,
		SameSite: writer.cookieConfig.SameSiteMode(),
	})
}

// Read returns the actual token from the session cookie
func (writer *CookieWriter) Read(ctx *gin.Context) string {
	value, err := ctx.Cookie(writer.cookieConfig.Name)
	if err != nil {
		return ""
	}

	return value
}
