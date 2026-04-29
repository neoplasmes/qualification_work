package redis

import (
	"context"
	"fmt"

	"auth/internal/config"

	goRedis "github.com/redis/go-redis/v9"
)

// Connect creates and verifies a Redis client.
func Connect(ctx context.Context, redisConfig config.Redis) (*goRedis.Client, error) {
	redisClient := goRedis.NewClient(&goRedis.Options{
		Addr:     fmt.Sprintf("%s:%d", redisConfig.Host, redisConfig.Port),
		Password: redisConfig.Password,
		DB:       redisConfig.DB,
	})

	if err := redisClient.Ping(ctx).Err(); err != nil {
		_ = redisClient.Close()

		return nil, fmt.Errorf("ping: %w", err)
	}

	return redisClient, nil
}
