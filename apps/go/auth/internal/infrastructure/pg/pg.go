package pg

import (
	"context"
	"fmt"

	"auth/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect creates and verifies a Postgres connection pool.
func Connect(ctx context.Context, postgresConfig config.Postgres) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable&default_query_exec_mode=simple_protocol",
		postgresConfig.User,
		postgresConfig.Password,
		postgresConfig.Host,
		postgresConfig.Port,
		postgresConfig.DB,
	))
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}

	poolConfig.MaxConns = postgresConfig.MaxConns

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()

		return nil, fmt.Errorf("ping: %w", err)
	}

	return pool, nil
}
