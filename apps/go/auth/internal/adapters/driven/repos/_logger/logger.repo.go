package logger

// LoggerRepo logs service events. This is almost useless because i didn't know about gin.Logger()
type LoggerRepo interface {
	// Debug logs a debug message
	Debug(msg string, args ...any)
	// Info logs an informational message
	Info(msg string, args ...any)
	// Warn logs a warning message
	Warn(msg string, args ...any)
	// Error logs an error message
	Error(msg string, args ...any)
}
