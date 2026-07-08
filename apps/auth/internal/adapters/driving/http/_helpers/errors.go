package helpers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	appErrors "auth/internal/core/errors"
)

// ErrorResponse is the JSON shape returned for errors
type ErrorResponse struct {
	Error  string            `json:"error" example:"validation failed"`
	Fields map[string]string `json:"fields,omitempty"`
}

// RespondError links domain errors to HTTP responses
func RespondError(ctx *gin.Context, err error) {
	var appError *appErrors.AppError
	if !errors.As(err, &appError) {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal error",
		})

		return
	}

	status := statusFor(appError.ErrorType)
	body := ErrorResponse{
		Error: appError.Message,
	}
	if len(appError.Fields) > 0 {
		body.Fields = appError.Fields
	}

	ctx.JSON(status, body)
}

func statusFor(kind appErrors.ErrorType) int {
	switch kind {
	case appErrors.ErrorTypeUnknown:
		return http.StatusInternalServerError
	case appErrors.ErrorTypeValidation:
		return http.StatusBadRequest
	case appErrors.ErrorTypeUnauthorized:
		return http.StatusUnauthorized
	case appErrors.ErrorTypeForbidden:
		return http.StatusForbidden
	case appErrors.ErrorTypeNotFound:
		return http.StatusNotFound
	case appErrors.ErrorTypeConflict:
		return http.StatusConflict
	case appErrors.ErrorTypeLocked:
		return http.StatusLocked
	default:
		return http.StatusInternalServerError
	}
}
