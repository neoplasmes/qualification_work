package auth

import (
	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/commands"

	"github.com/gin-gonic/gin"
)

// LogoutHandler handles /logout route
type LogoutHandler struct {
	logoutHandler *commands.LogoutHandler
	cookieWriter  *helpers.CookieWriter
}

// NewLogout creates LogoutHandler
func NewLogout(logoutHandler *commands.LogoutHandler, cookieWriter *helpers.CookieWriter) *LogoutHandler {
	return &LogoutHandler{
		logoutHandler: logoutHandler,
		cookieWriter:  cookieWriter,
	}
}

// Handle handles logouts
//
//	@Summary		Log out
//	@Description	Deletes the current session and clears the session cookie
//	@Tags			auth
//	@Produce		json
//	@Security		SessionCookie
//	@Success		204	{string}	string		"No Content"
//	@Header			204	{string}	Set-Cookie	"Cleared session cookie"
//	@Failure		500	{object}	helpers.ErrorResponse
//	@Router			/api/auth/logout [post]
func (handler *LogoutHandler) Handle(ctx *gin.Context) {
	token := handler.cookieWriter.Read(ctx)
	input := commands.LogoutInput{
		Token: token,
	}

	if _, err := handler.logoutHandler.Execute(ctx.Request.Context(), input); err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	handler.cookieWriter.Clear(ctx)
	ctx.Status(204)
}
