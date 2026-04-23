package logger

// LoggerRepo is a utility for logging to stdout/stderr and sending logs to external services if needed
type LoggerRepo interface {
	// LogInfo logs to stdout fd with info prefix
	LogInfo(msg string)
	// LogError logs to stderr fd with error prefix
	LogError(msg string)
}