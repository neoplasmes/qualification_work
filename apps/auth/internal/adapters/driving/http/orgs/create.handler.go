package orgs

import (
	"net/http"

	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/commands"

	"github.com/gin-gonic/gin"

	appErrors "auth/internal/core/errors"
)

// ownerId is accepted for compatibility, the owner is always the session user
type createBody struct {
	Name        string `json:"name" binding:"required,min=1,max=255" example:"acme"`
	DisplayName string `json:"displayName" binding:"required,min=1,max=255" example:"Acme"`
}

type createResponse struct {
	ID string `json:"id" example:"018f2f8f-7a0d-7a8c-9d31-0c05f4d90123"`
}

// CreateHandler handles org creation
type CreateHandler struct {
	createOrg    *commands.CreateOrgHandler
	cookieWriter *helpers.CookieWriter
}

// NewCreate creates a CreateHandler
func NewCreate(createOrg *commands.CreateOrgHandler, cookieWriter *helpers.CookieWriter) *CreateHandler {
	return &CreateHandler{
		createOrg:    createOrg,
		cookieWriter: cookieWriter,
	}
}

// Handle creates an org owned by the current user
//
//	@Summary	Create organization
//	@Tags		orgs
//	@Accept		json
//	@Produce	json
//	@Security	SessionCookie
//	@Param		body	body		createBody	true	"organization"
//	@Success	201		{object}	createResponse
//	@Failure	400		{object}	helpers.ErrorResponse
//	@Failure	401		{object}	helpers.ErrorResponse
//	@Failure	409		{object}	helpers.ErrorResponse
//	@Router		/api/orgs [post]
func (handler *CreateHandler) Handle(ctx *gin.Context) {
	var requestBody createBody
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		helpers.RespondError(ctx, appErrors.Validation(err.Error()))

		return
	}

	orgID, err := handler.createOrg.Execute(ctx.Request.Context(), commands.CreateOrgInput{
		Token:       handler.cookieWriter.Read(ctx),
		Name:        requestBody.Name,
		DisplayName: requestBody.DisplayName,
	})
	if err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	ctx.JSON(http.StatusCreated, createResponse{ID: orgID})
}
