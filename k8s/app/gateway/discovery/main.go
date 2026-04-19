package main;

import (
	"context";
	"log";
	"os";
	"os/signal";
	"strconv";
	"strings";
	"syscall";

	discoveryv1 "k8s.io/api/discovery/v1";
	"k8s.io/client-go/informers";
	"k8s.io/client-go/kubernetes";
	"k8s.io/client-go/rest";
	"k8s.io/client-go/tools/cache";
);

func main() {
	services := mustParseServices(mustEnv("WATCH_SERVICES"));
	pidPath := mustEnv("NGINX_PID_FILE");
	outPath := mustEnv("UPSTREAMS_OUTPUT");
	namespace := mustReadNamespace();

	cfg, err := rest.InClusterConfig();
	if err != nil {
		log.Fatalf("[discovery] in-cluster config: %v", err);
	}

	cs := kubernetes.NewForConfigOrDie(cfg);

	state := newState(services, outPath, pidPath);

	factory := informers.NewSharedInformerFactoryWithOptions(cs, 0,
		informers.WithNamespace(namespace));
	inf := factory.Discovery().V1().EndpointSlices().Informer();

	inf.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(o any) {
			if es, ok := o.(*discoveryv1.EndpointSlice); ok {
				state.applySlice(es, false);
			}
		},
		UpdateFunc: func(_, o any) {
			if es, ok := o.(*discoveryv1.EndpointSlice); ok {
				state.applySlice(es, false);
			}
		},
		DeleteFunc: func(o any) {
			es := extractDeleted(o);
			if es != nil {
				state.applySlice(es, true);
			}
		},
	});

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM);
	defer cancel();

	factory.Start(ctx.Done());
	factory.WaitForCacheSync(ctx.Done());

	log.Printf("[discovery] watching %d services in namespace %q", len(services), namespace);

	<-ctx.Done();
	log.Printf("[discovery] shutting down");
}

func mustParseServices(raw string) []Service {
	if raw == "" {
		log.Fatal("[discovery] WATCH_SERVICES is required");
	}

	var result []Service;
	for _, spec := range strings.Split(raw, ",") {
		parts := strings.Split(spec, ":");
		if len(parts) < 3 || len(parts) > 4 {
			log.Fatalf("[discovery] invalid spec %q (expected upstream:port:service[:algo])", spec);
		}

		port, err := strconv.Atoi(parts[1]);
		if err != nil {
			log.Fatalf("[discovery] invalid port in %q: %v", spec, err);
		}

		svc := Service{
			Upstream: parts[0],
			Port:     port,
			Service:  parts[2],
		};

		if len(parts) == 4 {
			svc.Algo = parts[3];
		}

		result = append(result, svc);
	}

	return result;
}

func mustReadNamespace() string {
	data, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace");
	if err != nil {
		log.Fatalf("[discovery] read namespace: %v", err);
	}

	return strings.TrimSpace(string(data));
}

func mustEnv(name string) string {
	v := os.Getenv(name);
	if v == "" {
		log.Fatalf("[discovery] %s is required", name);
	}

	return v;
}

func extractDeleted(o any) *discoveryv1.EndpointSlice {
	switch v := o.(type) {
	case *discoveryv1.EndpointSlice:
		return v;
	case cache.DeletedFinalStateUnknown:
		if es, ok := v.Obj.(*discoveryv1.EndpointSlice); ok {
			return es;
		}
	}

	return nil;
}
