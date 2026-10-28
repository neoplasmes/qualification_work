package orgs

import (
	"net/http"

	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/core/commands"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	appErrors "auth/internal/core/errors"
)

// DeleteHandler handles org deletion
type DeleteHandler struct {
	deleteOrg    *commands.DeleteOrgHandler
	cookieWriter *helpers.CookieWriter
}

// NewDelete creates a DeleteHandler
func NewDelete(deleteOrg *commands.DeleteOrgHandler, cookieWriter *helpers.CookieWriter) *DeleteHandler {
	return &DeleteHandler{
		deleteOrg:    deleteOrg,
		cookieWriter: cookieWriter,
	}
}

// Handle deletes an org owned by the current user
//
//	@Summary	Delete organization
//	@Tags		orgs
//	@Security	SessionCookie
//	@Param		id	path	string	true	"organization id"
//	@Success	204
//	@Failure	400	{object}	helpers.ErrorResponse
//	@Failure	401	{object}	helpers.ErrorResponse
//	@Failure	403	{object}	helpers.ErrorResponse
//	@Failure	404	{object}	helpers.ErrorResponse
//	@Router		/api/orgs/{id} [delete]
func (handler *DeleteHandler) Handle(ctx *gin.Context) {
	orgID := ctx.Param("id")
	if _, err := uuid.Parse(orgID); err != nil {
		helpers.RespondError(ctx, appErrors.ValidationFields(map[string]string{"id": "must be a uuid"}))

		return
	}

	if err := handler.deleteOrg.Execute(ctx.Request.Context(), commands.DeleteOrgInput{
		Token: handler.cookieWriter.Read(ctx),
		OrgID: orgID,
	}); err != nil {
		helpers.RespondError(ctx, err)

		return
	}

	ctx.Status(http.StatusNoContent)
}
