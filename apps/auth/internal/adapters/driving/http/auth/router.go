package auth

import "github.com/gin-gonic/gin"

type Handlers struct {
	SignUp *SignUpHandler
	SignIn *SignInHandler
	Logout *LogoutHandler
	Me     *MeHandler
}

func Register(routerGroup *gin.RouterGroup, handlers Handlers) {
	routerGroup.POST("/register", handlers.SignUp.Handle)
	routerGroup.POST("/login", handlers.SignIn.Handle)
	routerGroup.POST("/logout", handlers.Logout.Handle)
	routerGroup.GET("/me", handlers.Me.Handle)
}
