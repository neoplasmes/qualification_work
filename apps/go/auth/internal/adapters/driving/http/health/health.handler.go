package healthHTTP

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Pinger is an interface, with which every dependency of the service will be checked
type Pinger interface {
	Ping(ctx context.Context) error
}

type ReadyHandler struct {
	deps map[string]Pinger
}

func NewReady(deps map[string]Pinger) *ReadyHandler {
	return &ReadyHandler{
		deps: deps,
	}
}

// Handle returns readiness of the auth service
//
//	@Summary		Readiness check
//	@Description	Checks dependencies required to serve traffic
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	map[string]string
//	@Failure		503	{object}	map[string]string
//	@Router			/ready [get]
func (handler *ReadyHandler) Handle(ctx *gin.Context) {
	results := make(map[string]string, len(handler.deps))
	allOK := true
	for name, dependency := range handler.deps {
		if err := dependency.Ping(ctx.Request.Context()); err != nil {
			results[name] = err.Error()
			allOK = false
		} else {
			results[name] = "ok"
		}
	}

	status := http.StatusOK
	if !allOK {
		status = http.StatusServiceUnavailable
	}

	ctx.JSON(status, results)
}

//	@Summary		Health check
//	@Description	Returns ok when the process is running
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	map[string]string
//	@Router			/health [get]
func Health(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}
