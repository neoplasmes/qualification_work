package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"openresty-discovery/internal/config"
	"openresty-discovery/internal/discovery"
	"openresty-discovery/internal/upstream"
)

func main() {
	// `health` is the image health command: upstreams exist once the first sync rendered them
	if len(os.Args) > 1 && os.Args[1] == "health" {
		if _, err := os.Stat(os.Getenv("UPSTREAMS_OUTPUT")); err != nil {
			log.Fatalf("[discovery] unhealthy: %v", err)
		}

		return
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[discovery] config: %v", err)
	}

	var restCfg *rest.Config
	if cfg.Kubeconfig != "" {
		restCfg, err = clientcmd.BuildConfigFromFlags("", cfg.Kubeconfig)
	} else {
		restCfg, err = rest.InClusterConfig()
	}

	if err != nil {
		log.Fatalf("[discovery] kubernetes config: %v", err)
	}

	cs := kubernetes.NewForConfigOrDie(restCfg)

	state := upstream.NewState(cfg.Services, cfg.OutPath, cfg.PidPath)

	factory := informers.NewSharedInformerFactoryWithOptions(cs, 0,
		informers.WithNamespace(cfg.Namespace))

	if err := discovery.Register(factory.Discovery().V1().EndpointSlices().Informer(), state); err != nil {
		log.Fatalf("[discovery] register event handler: %v", err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	factory.Start(ctx.Done())
	factory.WaitForCacheSync(ctx.Done())

	log.Printf("[discovery] watching %d services in namespace %q", len(cfg.Services), cfg.Namespace)

	<-ctx.Done()
	log.Printf("[discovery] shutting down")
}
