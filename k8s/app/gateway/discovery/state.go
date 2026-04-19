package main;

import (
	"bytes";
	"fmt";
	"log";
	"os";
	"strconv";
	"strings";
	"sync";
	"syscall";

	discoveryv1 "k8s.io/api/discovery/v1";
);

type Service struct {
	Upstream string; // "client_backend"
	Service  string; // "client"
	Port     int;    // 3000
	Algo     string; // "least_conn" | "ip_hash" | "" (round-robin)
};

// State aggregates EndpointSlices into a per-service IP list.
// One Service in k8s can be backed by multiple EndpointSlices (chunked for scale),
// so we key by (serviceName, sliceName) and merge on render.
type State struct {
	mu       sync.Mutex;
	services []Service;
	slices   map[string]map[string][]string; // service name -> slice name -> [IP,...]
	outPath  string;
	pidPath  string;
	lastConf []byte;
};

func newState(services []Service, outPath, pidPath string) *State {
	return &State{
		services: services,
		slices:   make(map[string]map[string][]string),
		outPath:  outPath,
		pidPath:  pidPath,
	};
}

func (s *State) applySlice(es *discoveryv1.EndpointSlice, deleted bool) {
	s.mu.Lock();
	defer s.mu.Unlock();

	svcName := es.Labels[discoveryv1.LabelServiceName];
	if svcName == "" || !s.matters(svcName) {
		return;
	}

	if _, ok := s.slices[svcName]; !ok {
		s.slices[svcName] = make(map[string][]string);
	}

	if deleted {
		delete(s.slices[svcName], es.Name);
	} else {
		var ips []string;
		for _, ep := range es.Endpoints {
			if ep.Conditions.Ready != nil && !*ep.Conditions.Ready {
				continue;
			}
			ips = append(ips, ep.Addresses...);
		}
		s.slices[svcName][es.Name] = ips;
	}

	s.regenerate();
}

func (s *State) matters(name string) bool {
	for _, svc := range s.services {
		if svc.Service == name {
			return true;
		}
	}

	return false;
}

func (s *State) collectIPs(serviceName string) []string {
	var all []string;
	seen := make(map[string]struct{});
	for _, ips := range s.slices[serviceName] {
		for _, ip := range ips {
			if _, dup := seen[ip]; dup {
				continue;
			}
			seen[ip] = struct{}{};
			all = append(all, ip);
		}
	}

	return all;
}

func (s *State) regenerate() {
	var b bytes.Buffer;
	for _, svc := range s.services {
		fmt.Fprintf(&b, "upstream %s {\n", svc.Upstream);
		if svc.Algo != "" {
			fmt.Fprintf(&b, "    %s;\n", svc.Algo);
		}

		ips := s.collectIPs(svc.Service);
		if len(ips) == 0 {
			b.WriteString("    server 127.0.0.1:65535 down;\n");
		} else {
			for _, ip := range ips {
				fmt.Fprintf(&b, "    server %s:%d;\n", ip, svc.Port);
			}
		}

		b.WriteString("}\n\n");
	}

	if bytes.Equal(b.Bytes(), s.lastConf) {
		return;
	}

	if err := atomicWrite(s.outPath, b.Bytes()); err != nil {
		log.Printf("[discovery] write %s: %v", s.outPath, err);

		return;
	}
	s.lastConf = append(s.lastConf[:0], b.Bytes()...);

	log.Printf("[discovery] upstreams.conf regenerated:\n%s", b.String());

	if err := sighup(s.pidPath); err != nil {
		log.Printf("[discovery] sighup: %v", err);
	} else {
		log.Printf("[discovery] sent SIGHUP to nginx");
	}
}

func sighup(pidPath string) error {
	data, err := os.ReadFile(pidPath);
	if err != nil {
		return err;
	}

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)));
	if err != nil {
		return err;
	}

	return syscall.Kill(pid, syscall.SIGHUP);
}

func atomicWrite(path string, data []byte) error {
	tmp := path + ".tmp";
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err;
	}

	return os.Rename(tmp, path);
}
