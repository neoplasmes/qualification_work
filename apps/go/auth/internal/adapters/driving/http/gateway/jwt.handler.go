package gateway

import (
	"net/http"

	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/queries"

	"github.com/gin-gonic/gin"
)

// JWTHandler serves OpenResty auth_request for	internal JWTs
type JWTHandler struct {
	jwtHandler   *queries.JWTHandler
	cookieWriter *helpers.CookieWriter
}

// NewJWT creates a JWTHandler
func NewJWT(jwtHandler *queries.JWTHandler, cookieWriter *helpers.CookieWriter) *JWTHandler {
	return &JWTHandler{
		jwtHandler:   jwtHandler,
		cookieWriter: cookieWriter,
	}
}

// @Summary		Issue internal JWT
// @Description	Issues a signed internal JWT for gateway auth_request
// @Tags			gateway
// @Produce		json
// @Security		SessionCookie
// @Success		204	{string}	string			"No Content"
// @Header			204	{string}	X-Internal-Auth	"Signed internal JWT"
// @Failure		401	{object}	helpers.ErrorResponse
// @Failure		500	{object}	helpers.ErrorResponse
// @Router			/gateway/jwt [get]
func (handler *JWTHandler) Handle(ctx *gin.Context) {
	token := handler.cookieWriter.Read(ctx)
	output, err := handler.jwtHandler.Execute(ctx.Request.Context(), queries.JWTInput{
		Token: token,
	})
	if err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	ctx.Header("X-Internal-Auth", output.JWT)
	if output.IsInitializing {
		ctx.Header("X-User-Initializing", "1")
		ctx.Header("Cache-Control", "no-store")
		ctx.Status(http.StatusAccepted)

		return
	} else {
		// This response is personal and cached by OpenResty.
		ctx.Header("Cache-Control", "private, max-age=30")
	}
	ctx.Status(204)
}
