package auth

import (
	"net/http"

	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/queries"

	"github.com/gin-gonic/gin"
)

type meOrgDTO struct {
	ID   string `json:"id" example:"org_123"`
	Name string `json:"name" example:"Acme"`
	Role string `json:"role" example:"owner"`
}

type meBody struct {
	ID            string     `json:"id" example:"user_123"`
	Email         string     `json:"email" example:"user@example.com"`
	Name          string     `json:"name" example:"Jane"`
	Family        string     `json:"family" example:"Doe"`
	Organizations []meOrgDTO `json:"organizations"`
}

// MeHandler handles /me requests
type MeHandler struct {
	meHandler    *queries.MeHandler
	cookieWriter *helpers.CookieWriter
}

// NewMe creates a MeHandler
func NewMe(meHandler *queries.MeHandler, cookieWriter *helpers.CookieWriter) *MeHandler {
	return &MeHandler{
		meHandler:    meHandler,
		cookieWriter: cookieWriter,
	}
}

// Handle returns the current user's profile
//
//	@Summary		Get current user
//	@Description	Returns the profile linked to the session cookie
//	@Tags			auth
//	@Produce		json
//	@Security		SessionCookie
//	@Success		200	{object}	meBody
//	@Failure		401	{object}	helpers.ErrorResponse
//	@Failure		500	{object}	helpers.ErrorResponse
//	@Router			/api/auth/me [get]
func (handler *MeHandler) Handle(ctx *gin.Context) {
	token := handler.cookieWriter.Read(ctx)
	output, err := handler.meHandler.Execute(ctx.Request.Context(), queries.MeInput{
		Token: token,
	})
	if err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	organizations := make([]meOrgDTO, 0, len(output.Orgs))
	for _, organization := range output.Orgs {
		organizations = append(organizations, meOrgDTO{
			ID:   organization.ID,
			Name: organization.Name,
			Role: string(organization.Role),
		})
	}

	ctx.JSON(http.StatusOK, meBody{
		ID:            output.ID,
		Email:         output.Email,
		Name:          output.Name,
		Family:        output.Family,
		Organizations: organizations,
	})
}
