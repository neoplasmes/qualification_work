// Package discovery feeds EndpointSlice informer events into upstream state
package discovery

import (
	"fmt"

	discoveryv1 "k8s.io/api/discovery/v1"
	"k8s.io/client-go/tools/cache"

	"openresty-discovery/internal/upstream"
)

// Register subscribes state to EndpointSlice add, update and delete events
func Register(inf cache.SharedIndexInformer, state *upstream.State) error {
	_, err := inf.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(o any) {
			if es, ok := o.(*discoveryv1.EndpointSlice); ok {
				state.ApplySlice(es, false)
			}
		},
		UpdateFunc: func(_, o any) {
			if es, ok := o.(*discoveryv1.EndpointSlice); ok {
				state.ApplySlice(es, false)
			}
		},
		DeleteFunc: func(o any) {
			es := extractDeleted(o)
			if es != nil {
				state.ApplySlice(es, true)
			}
		},
	})
	if err != nil {
		return fmt.Errorf("add endpointslice handler: %w", err)
	}

	return nil
}

func extractDeleted(o any) *discoveryv1.EndpointSlice {
	switch v := o.(type) {
	case *discoveryv1.EndpointSlice:
		return v
	case cache.DeletedFinalStateUnknown:
		if es, ok := v.Obj.(*discoveryv1.EndpointSlice); ok {
			return es
		}
	}

	return nil
}
