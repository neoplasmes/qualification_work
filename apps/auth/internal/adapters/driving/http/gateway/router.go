package gateway

import "github.com/gin-gonic/gin"

type Handlers struct {
	JWT  *JWTHandler
	JWKS *JWKSHandler
}

func Register(routerGroup *gin.RouterGroup, handlers Handlers) {
	routerGroup.GET("/jwt", handlers.JWT.Handle)
	routerGroup.GET("/.well-known/jwks.json", handlers.JWKS.Handle)
}
