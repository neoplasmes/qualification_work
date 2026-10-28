// Package config reads discovery settings from the environment
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

const namespaceFile = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"

type Service struct {
	Upstream string // "client_backend"
	Service  string // "client"
	Port     int    // 3000
	Algo     string // "least_conn" | "ip_hash" | "" (round-robin)
}

type Config struct {
	Services   []Service
	PidPath    string
	OutPath    string
	Namespace  string
	Kubeconfig string // empty inside the cluster, set for local dev
}

// Load reads the watched services, file paths and namespace
func Load() (Config, error) {
	cfg := Config{
		PidPath:    os.Getenv("NGINX_PID_FILE"),
		OutPath:    os.Getenv("UPSTREAMS_OUTPUT"),
		Namespace:  os.Getenv("NAMESPACE"),
		Kubeconfig: os.Getenv("KUBECONFIG"),
	}

	if cfg.PidPath == "" || cfg.OutPath == "" {
		return cfg, errors.New("NGINX_PID_FILE and UPSTREAMS_OUTPUT are required")
	}

	services, err := ParseServices(os.Getenv("WATCH_SERVICES"))
	if err != nil {
		return cfg, err
	}
	cfg.Services = services

	if cfg.Namespace == "" {
		data, err := os.ReadFile(namespaceFile)
		if err != nil {
			return cfg, fmt.Errorf("read namespace: %w", err)
		}
		cfg.Namespace = strings.TrimSpace(string(data))
	}

	return cfg, nil
}

// ParseServices parses "upstream:port:service[:algo]" specs separated by commas
func ParseServices(raw string) ([]Service, error) {
	if raw == "" {
		return nil, errors.New("WATCH_SERVICES is required")
	}

	specs := strings.Split(raw, ",")
	result := make([]Service, 0, len(specs))
	for _, spec := range specs {
		parts := strings.Split(spec, ":")
		if len(parts) < 3 || len(parts) > 4 {
			return nil, fmt.Errorf("invalid spec %q (expected upstream:port:service[:algo])", spec)
		}

		port, err := strconv.Atoi(parts[1])
		if err != nil {
			return nil, fmt.Errorf("invalid port in %q: %w", spec, err)
		}

		svc := Service{
			Upstream: parts[0],
			Port:     port,
			Service:  parts[2],
		}

		if len(parts) == 4 {
			svc.Algo = parts[3]
		}

		result = append(result, svc)
	}

	return result, nil
}
