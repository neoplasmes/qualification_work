package pg

import (
	"context"
	"fmt"
	"io/fs"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Migrate applies sql files in name order inside one transaction guarded by an advisory lock
func Migrate(ctx context.Context, pool *pgxpool.Pool, files fs.FS) error {
	names, err := fs.Glob(files, "*.sql")
	if err != nil {
		return fmt.Errorf("migrate glob: %w", err)
	}
	sort.Strings(names)

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("migrate begin: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext('migrations'))`); err != nil {
		return fmt.Errorf("migrate lock: %w", err)
	}

	for _, name := range names {
		script, err := fs.ReadFile(files, name)
		if err != nil {
			return fmt.Errorf("migrate read %s: %w", name, err)
		}

		if _, err := tx.Exec(ctx, string(script)); err != nil {
			return fmt.Errorf("migrate %s: %w", name, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("migrate commit: %w", err)
	}

	return nil
}
