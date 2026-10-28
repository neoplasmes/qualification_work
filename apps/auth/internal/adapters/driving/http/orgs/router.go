package orgs

import "github.com/gin-gonic/gin"

type Handlers struct {
	Create *CreateHandler
	Delete *DeleteHandler
}

func Register(routerGroup *gin.RouterGroup, handlers Handlers) {
	routerGroup.POST("", handlers.Create.Handle)
	routerGroup.DELETE("/:id", handlers.Delete.Handle)
}
