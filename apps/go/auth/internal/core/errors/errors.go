package errors

import "fmt"

// ErrorType is a domain error category
type ErrorType int

const (
	ErrorTypeUnknown ErrorType = iota
	ErrorTypeValidation
	ErrorTypeUnauthorized
	ErrorTypeForbidden
	ErrorTypeNotFound
	ErrorTypeConflict
	ErrorTypeLocked
)

type AppError struct {
	ErrorType ErrorType
	Message   string
	// Fields optionally describes invalid fields
	Fields map[string]string
}

// Error returns the actual error message to be sent
func (e *AppError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return fmt.Sprintf("app error: kind=%d", e.ErrorType)
}

// New creates an AppError with the given category and message
func New(kind ErrorType, msg string) *AppError {
	return &AppError{
		ErrorType: kind,
		Message:   msg,
	}
}

// Conflict creates a conflict error
func Conflict(msg string) *AppError {
	return New(ErrorTypeConflict, msg)
}

// Unauthorized creates an authentication error
func Unauthorized(msg string) *AppError {
	return New(ErrorTypeUnauthorized, msg)
}

// Locked creates a lockout error
func Locked(msg string) *AppError {
	return New(ErrorTypeLocked, msg)
}

// NotFound creates a not-found error
func NotFound(msg string) *AppError {
	return New(ErrorTypeNotFound, msg)
}

// Validation creates a validation error
func Validation(msg string) *AppError {
	return New(ErrorTypeValidation, msg)
}

// ValidationFields creates a validation error with details per-field
func ValidationFields(fields map[string]string) *AppError {
	return &AppError{
		ErrorType: ErrorTypeValidation,
		Message:   "validation failed",
		Fields:    fields,
	}
}
