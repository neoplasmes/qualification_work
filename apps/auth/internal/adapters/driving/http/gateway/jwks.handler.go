package gateway

import (
	"net/http"

	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/ports/driven/tools"

	"github.com/gin-gonic/gin"

	appErrors "auth/internal/core/errors"
)

type JWKSResponse struct {
	Keys []JWKDocument `json:"keys"`
}

type JWKDocument struct {
	Kty string `json:"kty" example:"RSA"`
	Kid string `json:"kid" example:"auth-key"`
	Use string `json:"use" example:"sig"`
	Alg string `json:"alg" example:"RS256"`
	N   string `json:"n" example:"base64url-modulus"`
	E   string `json:"e" example:"AQAB"`
}

// JWKSHandler returns the current public key set from /.well-known/jwks endpoint
type JWKSHandler struct {
	issuer tools.JWTIssuerTool
}

// NewJWKS creates a JWKSHandler
func NewJWKS(issuer tools.JWTIssuerTool) *JWKSHandler {
	return &JWKSHandler{
		issuer: issuer,
	}
}

// Handle returns the public JWKS document
//
//	@Summary		Get JWKS
//	@Description	Returns public keys used to validate internal JWTs
//	@Tags			gateway
//	@Produce		json
//	@Success		200	{object}	JWKSResponse
//	@Failure		500	{object}	helpers.ErrorResponse
//	@Router			/gateway/.well-known/jwks.json [get]
func (handler *JWKSHandler) Handle(ctx *gin.Context) {
	body, err := handler.issuer.JWKS()
	if err != nil {
		helpers.RespondError(ctx, appErrors.New(appErrors.ErrorTypeUnknown, "jwks: failed to build"))

		return
	}

	ctx.Header("Cache-Control", "public, max-age=300")
	ctx.Data(http.StatusOK, "application/json", body)
}
