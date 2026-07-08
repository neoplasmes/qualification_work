package auth

import (
	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/commands"

	"github.com/gin-gonic/gin"

	appErrors "auth/internal/core/errors"
)

type signInBody struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Password string `json:"password" binding:"required,min=8" example:"strong-password"`
}

// SignInHandler handles /login requests
type SignInHandler struct {
	signInHandler *commands.SignInHandler
	cookieWriter  *helpers.CookieWriter
}

// NewSignIn creates a SignInHandler
func NewSignIn(signInHandler *commands.SignInHandler, cookieWriter *helpers.CookieWriter) *SignInHandler {
	return &SignInHandler{
		signInHandler: signInHandler,
		cookieWriter:  cookieWriter,
	}
}

// Handle signs in a user and sets a session cookie
//
//	@Summary		Sign in
//	@Description	Verifies credentials and sets a session cookie
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		signInBody	true	"Credentials"
//	@Success		204		{string}	string		"No Content"
//	@Header			204		{string}	Set-Cookie	"Session cookie"
//	@Failure		400		{object}	helpers.ErrorResponse
//	@Failure		401		{object}	helpers.ErrorResponse
//	@Failure		423		{object}	helpers.ErrorResponse
//	@Failure		500		{object}	helpers.ErrorResponse
//	@Router			/api/auth/login [post]
func (handler *SignInHandler) Handle(ctx *gin.Context) {
	var requestBody signInBody
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		helpers.RespondError(ctx, appErrors.Validation(err.Error()))

		return
	}

	output, err := handler.signInHandler.Execute(ctx.Request.Context(), commands.SignInInput{
		Email:    requestBody.Email,
		Password: requestBody.Password,
	})
	if err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	handler.cookieWriter.Set(ctx, output.Token)
	ctx.Status(204)
}
