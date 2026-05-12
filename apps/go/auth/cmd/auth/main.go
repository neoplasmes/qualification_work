package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"auth/internal/adapters"
	"auth/internal/adapters/driven/tools/hasher"
	"auth/internal/adapters/driven/tools/tokenGenerator"
	helpers "auth/internal/adapters/driving/http/_helpers"
	"auth/internal/config"
	"auth/internal/core/commands"
	"auth/internal/core/queries"

	logger "auth/internal/adapters/driven/repos/_logger"
	orgRepo "auth/internal/adapters/driven/repos/org"
	sessionRepo "auth/internal/adapters/driven/repos/session"
	userRepo "auth/internal/adapters/driven/repos/user"

	jwtTool "auth/internal/adapters/driven/tools/jwt"

	authHTTP "auth/internal/adapters/driving/http/auth"
	gatewayHTTP "auth/internal/adapters/driving/http/gateway"
	healthHTTP "auth/internal/adapters/driving/http/health"

	pgClient "auth/internal/infrastructure/pg"
	redisClient "auth/internal/infrastructure/redis"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// API docs for the auth service.
//
//	@title						Qualification Auth API
//	@version					1.0
//	@description				Authentication service for sessions and internal JWTs.
//	@host						localhost:3002
//	@BasePath					/
//	@schemes					http
//	@securityDefinitions.apikey	SessionCookie
//	@in							cookie
//	@name						session
func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "auth: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	appConfig, err := config.Load()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}

	appLogger := logger.NewStdout(appConfig.LogLevel)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	postgresPool, err := pgClient.Connect(ctx, appConfig.DatabaseURL)
	if err != nil {
		return fmt.Errorf("pg: %w", err)
	}
	defer postgresPool.Close()

	redisConnection, err := redisClient.Connect(ctx, appConfig.Redis)
	if err != nil {
		return fmt.Errorf("redis: %w", err)
	}
	defer func() {
		_ = redisConnection.Close()
	}()

	privateKey, err := appConfig.LoadRSAPrivateKey()
	if err != nil {
		return fmt.Errorf("rsa key: %w", err)
	}

	// ———————————————————————————————————— Tools ————————————————————————————————————
	passwordHasher := hasher.NewArgon2(appConfig.Pepper)
	tokenGeneratorTool := tokenGenerator.NewUUID()
	jwtIssuer := jwtTool.NewRSA(privateKey, appConfig.InternalJWT.KID)

	// ———————————————————————————————————— Repos ————————————————————————————————————
	pgUserRepo := userRepo.NewPg(postgresPool)
	pgOrgRepo := orgRepo.NewPg(postgresPool)
	redisSessionRepo := sessionRepo.NewRedis(redisConnection, tokenGeneratorTool, appConfig.Session.TTL)

	// ——————————————————————————————— HTTP handlers —————————————————————————————————
	signUpHandler := commands.NewSignUp(pgUserRepo, passwordHasher)
	signInHandler := commands.NewSignIn(pgUserRepo, redisSessionRepo, passwordHasher, commands.LockoutPolicy{
		MaxFailedAttempts: appConfig.Lockout.MaxFailedAttempts,
		Duration:          appConfig.Lockout.Duration,
	})
	logoutHandler := commands.NewLogout(redisSessionRepo)
	meHandler := queries.NewMe(redisSessionRepo, pgUserRepo, pgOrgRepo)
	jwtHandler := queries.NewJWT(redisSessionRepo, pgOrgRepo, jwtIssuer, queries.JWTIssuerPolicy{
		Issuer:   appConfig.InternalJWT.Issuer,
		Audience: appConfig.InternalJWT.Audience,
		TTL:      appConfig.InternalJWT.TTL,
	})

	cookieWriter := helpers.NewCookieWriter(appConfig.Cookie, appConfig.Session.TTL)
	readyHandler := healthHTTP.NewReady(map[string]healthHTTP.Pinger{
		"postgres": pgPinger{
			pool: postgresPool,
		},
		"redis": redisPinger{
			client: redisConnection,
		},
	})

	// ————————————————————————————————————————————————————————————————————————————
	// ———————————————————————————— Application setup —————————————————————————————
	engine := adapters.CreateApp(adapters.Deps{
		CORSEnabled: appConfig.CORSEnabled,
		Handlers: adapters.HTTPHandlers{
			Auth: authHTTP.Handlers{
				SignUp: authHTTP.NewSignUp(signUpHandler),
				SignIn: authHTTP.NewSignIn(signInHandler, cookieWriter),
				Logout: authHTTP.NewLogout(logoutHandler, cookieWriter),
				Me:     authHTTP.NewMe(meHandler, cookieWriter),
			},
			Gateway: gatewayHTTP.Handlers{
				JWT:  gatewayHTTP.NewJWT(jwtHandler, cookieWriter),
				JWKS: gatewayHTTP.NewJWKS(jwtIssuer),
			},
			Ready: readyHandler,
		},
	})

	server := &http.Server{
		Addr:              fmt.Sprintf(":%d", appConfig.Port),
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
	}

	errorChannel := make(chan error, 1)
	go func() {
		appLogger.Info("listening", "addr", server.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errorChannel <- err
		}
	}()

	select {
	case <-ctx.Done():
		appLogger.Info("shutting down")
	case err := <-errorChannel:
		return err
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}

	return nil
}

// pgPinger adapts pgxpool.Pool to health checks.
type pgPinger struct {
	pool *pgxpool.Pool
}

// Ping verifies Postgres reachability.
func (pinger pgPinger) Ping(ctx context.Context) error {
	if err := pinger.pool.Ping(ctx); err != nil {
		return fmt.Errorf("postgres ping: %w", err)
	}

	return nil
}

// redisPinger adapts redis.Client to health checks.
type redisPinger struct {
	client *redis.Client
}

// Ping verifies Redis reachability.
func (pinger redisPinger) Ping(ctx context.Context) error {
	if err := pinger.client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis ping: %w", err)
	}

	return nil
}
