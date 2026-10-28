package adapters

import (
	authHTTP "auth/internal/adapters/driving/http/auth"
	gatewayHTTP "auth/internal/adapters/driving/http/gateway"
	healthHTTP "auth/internal/adapters/driving/http/health"
	orgsHTTP "auth/internal/adapters/driving/http/orgs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type HTTPHandlers struct {
	Auth    authHTTP.Handlers
	Gateway gatewayHTTP.Handlers
	Orgs    orgsHTTP.Handlers
	Ready   *healthHTTP.ReadyHandler
}

// Deps is a kind of dependency-injection tool
type Deps struct {
	Handlers    HTTPHandlers
	CORSEnabled bool
}

// CreateApp builds the Gin engine and mounts all routers
func CreateApp(deps Deps) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(gin.Logger())

	if deps.CORSEnabled {
		router.Use(cors.Default())
	}

	router.GET("/health", healthHTTP.Health)
	router.GET("/ready", deps.Handlers.Ready.Handle)

	authHTTP.Register(router.Group("/api/auth"), deps.Handlers.Auth)
	gatewayHTTP.Register(router.Group("/gateway"), deps.Handlers.Gateway)
	orgsHTTP.Register(router.Group("/api/orgs"), deps.Handlers.Orgs)

	return router
}
