package main

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	discoveryv1 "k8s.io/api/discovery/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/tools/cache"
);

func TestInformer_PicksUpEndpointSliceLifecycle(t *testing.T) {
	state := newState(
		[]Service{{Upstream: "server_backend", Service: "server", Port: 3001, Algo: "least_conn"}},
		filepath.Join(t.TempDir(), "upstreams.conf"),
		"/nonexistent-pid",
	);

	cs := fake.NewSimpleClientset();
	factory := informers.NewSharedInformerFactoryWithOptions(cs, 0,
		informers.WithNamespace("app"));

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
			if es := extractDeleted(o); es != nil {
				state.applySlice(es, true);
			}
		},
	});

	stop := make(chan struct{});
	defer close(stop);

	factory.Start(stop);
	factory.WaitForCacheSync(stop);

	ctx := context.Background();
	eps := cs.DiscoveryV1().EndpointSlices("app");
	ready := true;

	created, err := eps.Create(ctx, &discoveryv1.EndpointSlice{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "server-abc",
			Namespace: "app",
			Labels:    map[string]string{discoveryv1.LabelServiceName: "server"},
		},
		Endpoints: []discoveryv1.Endpoint{
			{Addresses: []string{"10.0.0.1"}, Conditions: discoveryv1.EndpointConditions{Ready: &ready}},
		},
	}, metav1.CreateOptions{});
	if err != nil {
		t.Fatalf("create slice: %v", err);
	}

	waitFor(t, 2*time.Second, func() bool {
		ips := state.collectIPs("server");

		return len(ips) == 1 && ips[0] == "10.0.0.1";
	}, "expected 1 IP after create");

	created.Endpoints = append(created.Endpoints, discoveryv1.Endpoint{
		Addresses:  []string{"10.0.0.2"},
		Conditions: discoveryv1.EndpointConditions{Ready: &ready},
	});

	if _, err := eps.Update(ctx, created, metav1.UpdateOptions{}); err != nil {
		t.Fatalf("update slice: %v", err);
	}

	waitFor(t, 2*time.Second, func() bool {
		return len(state.collectIPs("server")) == 2;
	}, "expected 2 IPs after update");

	if _, err := eps.Create(ctx, &discoveryv1.EndpointSlice{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "server-def",
			Namespace: "app",
			Labels:    map[string]string{discoveryv1.LabelServiceName: "server"},
		},
		Endpoints: []discoveryv1.Endpoint{
			{Addresses: []string{"10.0.0.3"}, Conditions: discoveryv1.EndpointConditions{Ready: &ready}},
		},
	}, metav1.CreateOptions{}); err != nil {
		t.Fatalf("create second slice: %v", err);
	}

	waitFor(t, 2*time.Second, func() bool {
		return len(state.collectIPs("server")) == 3;
	}, "expected 3 IPs after second slice create");

	// DELETE первый slice
	if err := eps.Delete(ctx, "server-abc", metav1.DeleteOptions{}); err != nil {
		t.Fatalf("delete slice: %v", err);
	}

	waitFor(t, 2*time.Second, func() bool {
		ips := state.collectIPs("server");
		return len(ips) == 1 && ips[0] == "10.0.0.3";
	}, "expected only IP from second slice after delete");
}

func TestInformer_FiltersUnknownServiceAndNotReady(t *testing.T) {
	state := newState(
		[]Service{{Upstream: "server_backend", Service: "server", Port: 3001}},
		filepath.Join(t.TempDir(), "upstreams.conf"),
		"/nonexistent-pid",
	);

	cs := fake.NewSimpleClientset();
	factory := informers.NewSharedInformerFactoryWithOptions(cs, 0,
		informers.WithNamespace("app"));
	inf := factory.Discovery().V1().EndpointSlices().Informer();
	inf.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(o any) { state.applySlice(o.(*discoveryv1.EndpointSlice), false); },
	});

	stop := make(chan struct{});
	defer close(stop);
	factory.Start(stop);
	factory.WaitForCacheSync(stop);

	ctx := context.Background();
	eps := cs.DiscoveryV1().EndpointSlices("app");
	yes, no := true, false;

	if _, err := eps.Create(ctx, &discoveryv1.EndpointSlice{
		ObjectMeta: metav1.ObjectMeta{
			Name: "other-1", Namespace: "app",
			Labels: map[string]string{discoveryv1.LabelServiceName: "other"},
		},
		Endpoints: []discoveryv1.Endpoint{
			{Addresses: []string{"10.0.0.99"}, Conditions: discoveryv1.EndpointConditions{Ready: &yes}},
		},
	}, metav1.CreateOptions{}); err != nil {
		t.Fatalf("create: %v", err);
	}

	if _, err := eps.Create(ctx, &discoveryv1.EndpointSlice{
		ObjectMeta: metav1.ObjectMeta{
			Name: "server-1", Namespace: "app",
			Labels: map[string]string{discoveryv1.LabelServiceName: "server"},
		},
		Endpoints: []discoveryv1.Endpoint{
			{Addresses: []string{"10.0.0.1"}, Conditions: discoveryv1.EndpointConditions{Ready: &yes}},
			{Addresses: []string{"10.0.0.2"}, Conditions: discoveryv1.EndpointConditions{Ready: &no}},
		},
	}, metav1.CreateOptions{}); err != nil {
		t.Fatalf("create: %v", err);
	}

	waitFor(t, 2*time.Second, func() bool {
		ips := state.collectIPs("server");
		return len(ips) == 1 && ips[0] == "10.0.0.1";
	}, "expected only ready IP from our service");


	if got := state.collectIPs("other"); len(got) != 0 {
		t.Fatalf("unknown service tracked: %v", got);
	}
}

func waitFor(t *testing.T, timeout time.Duration, cond func() bool, msg string) {
	t.Helper();
	deadline := time.Now().Add(timeout);

	for time.Now().Before(deadline) {
		if cond() {
			return;
		}
		time.Sleep(20 * time.Millisecond);
	}

	t.Fatal(msg);
}
