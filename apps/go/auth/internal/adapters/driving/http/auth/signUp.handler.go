package auth

import (
	"net/http"

	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/commands"

	"github.com/gin-gonic/gin"

	appErrors "auth/internal/core/errors"
)

type signUpBody struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Password string `json:"password" binding:"required,min=8" example:"strong-password"`
	Name     string `json:"name" binding:"required,min=1" example:"Jane"`
	Family   string `json:"family" binding:"required,min=1" example:"Doe"`
}

type signUpResponse struct {
	ID string `json:"id" example:"018f2f8f-7a0d-7a8c-9d31-0c05f4d90123"`
}

// SignUpHandler handles /sigup requests
type SignUpHandler struct {
	signUpHandler *commands.SignUpHandler
}

// NewSignUp creates a SignUpHandler
func NewSignUp(signUpHandler *commands.SignUpHandler) *SignUpHandler {
	return &SignUpHandler{
		signUpHandler: signUpHandler,
	}
}

// Handle registers new users
//
//	@Summary		Register a user
//	@Description	Creates a user account
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		signUpBody	true	"Registration payload"
//	@Success		201		{object}	signUpResponse
//	@Failure		400		{object}	helpers.ErrorResponse
//	@Failure		409		{object}	helpers.ErrorResponse
//	@Failure		500		{object}	helpers.ErrorResponse
//	@Router			/api/auth/register [post]
func (handler *SignUpHandler) Handle(ctx *gin.Context) {
	var requestBody signUpBody
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		helpers.RespondError(ctx, appErrors.Validation(err.Error()))

		return
	}

	output, err := handler.signUpHandler.Execute(ctx.Request.Context(), commands.SignUpInput{
		Email:    requestBody.Email,
		Password: requestBody.Password,
		Name:     requestBody.Name,
		Family:   requestBody.Family,
	})
	if err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	ctx.JSON(http.StatusCreated, signUpResponse{
		ID: output.ID,
	})
}
