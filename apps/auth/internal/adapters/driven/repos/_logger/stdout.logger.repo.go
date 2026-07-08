package logger

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
)

const (
	ansiReset  = "\033[0m"
	ansiDim    = "\033[2m"
	ansiCyan   = "\033[36m"
	ansiGreen  = "\033[32m"
	ansiYellow = "\033[33m"
	ansiRed    = "\033[31m"
)

// TODO: solve this performance issue
// Stdout writes colored log lines to os.Stdout
type Stdout struct {
	logger *slog.Logger
}

// NewStdout creates a Stdout logger at the given level (debug|info|warn|error)
func NewStdout(level string) *Stdout {
	var slogLevel slog.Level
	_ = slogLevel.UnmarshalText([]byte(level))

	return &Stdout{
		logger: slog.New(&colorHandler{
			writer:   os.Stdout,
			minLevel: slogLevel,
		}),
	}
}

func (stdout *Stdout) Debug(msg string, args ...any) {
	stdout.logger.Debug(msg, args...)
}

func (stdout *Stdout) Info(msg string, args ...any) {
	stdout.logger.Info(msg, args...)
}

func (stdout *Stdout) Warn(msg string, args ...any) {
	stdout.logger.Warn(msg, args...)
}

func (stdout *Stdout) Error(msg string, args ...any) {
	stdout.logger.Error(msg, args...)
}

type colorHandler struct {
	writer   io.Writer
	minLevel slog.Level
}

func (handler *colorHandler) Enabled(_ context.Context, level slog.Level) bool {
	return level >= handler.minLevel
}

func (handler *colorHandler) Handle(_ context.Context, record slog.Record) error {
	timestamp := record.Time.Format("15:04:05")
	color := levelColor(record.Level)
	label := fmt.Sprintf("%-5s", record.Level.String())

	line := fmt.Sprintf("%s%s%s %s%s%s  %s", ansiDim, timestamp, ansiReset, color, label, ansiReset, record.Message)

	record.Attrs(func(attribute slog.Attr) bool {
		line += fmt.Sprintf("  %s%s%s=%v", ansiDim, attribute.Key, ansiReset, attribute.Value)

		return true
	})

	_, err := fmt.Fprintln(handler.writer, line)

	return err
}

func (handler *colorHandler) WithAttrs(_ []slog.Attr) slog.Handler {
	return handler
}

func (handler *colorHandler) WithGroup(_ string) slog.Handler {
	return handler
}

func levelColor(level slog.Level) string {
	switch {
	case level < slog.LevelInfo:
		return ansiCyan
	case level < slog.LevelWarn:
		return ansiGreen
	case level < slog.LevelError:
		return ansiYellow
	default:
		return ansiRed
	}
}
