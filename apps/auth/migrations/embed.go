// Package migrations embeds idempotent sql files applied on startup
package migrations

import "embed"

// Files holds the migrations in name order
//
//go:embed *.sql
var Files embed.FS
