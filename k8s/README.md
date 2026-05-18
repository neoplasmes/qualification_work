# k3s/k3d deploy

End-to-end deploy targeting k3s (production) and k3d (local). All images come from ghcr.io/neoplasmes/qualification_work and pinned to the `:custom` tag (see `scripts/ghcr.deploy.sh`).

## Layout

```
k8s/
├── k3d.config.yaml                # local cluster definition (k3d create -c ...)
├── helmfile.yaml.gotmpl           # postgres + redis (bitnami charts)
├── ghcr/secret.yaml               # imagePullSecret for ghcr.io
├── postgres/
│   ├── values.yaml                # bitnami postgresql values
│   └── migrations/init/           # bootstrap sql job + kustomize configmap
├── redis/values.yaml              # bitnami redis values
└── app/
    ├── kustomization.yaml         # aggregator for everything app-side
    ├── namespace.yaml
    ├── configmap.yaml             # shared non-secret env
    ├── secret.yaml                # shared secrets (ignored in git via .gitignore patterns)
    ├── client/                    # node ssr client
    ├── server/                    # node api server
    ├── data-service/              # node data-service (csv merge, etc.)
    ├── auth/                      # go auth service + jwt key secret
    └── gateway/                   # openresty + discovery sidecar
```

## Pre-flight

1. Push images to ghcr (see "Building and pushing images").
2. Generate the auth jwt private key and create the secret:
   ```bash
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /tmp/jwt.private.pem
   kubectl -n app create secret generic auth-jwt-key \
     --from-file=jwt.private.pem=/tmp/jwt.private.pem \
     --dry-run=client -o yaml > k8s/app/auth/secret.yaml
   ```
   The path is gitignored locally.

## Local k3d

```bash
# 1. create cluster
k3d cluster create -c k8s/k3d.config.yaml

# 2. namespace + ghcr pull secret first so helm releases can use the namespace
kubectl apply -f k8s/app/namespace.yaml
kubectl apply -f k8s/ghcr/secret.yaml

# 3. postgres + redis via helm
export POSTGRES_PASSWORD=qualification_local_password
helmfile -f k8s/helmfile.yaml.gotmpl apply

# 4. seed schema (kustomize references infrastructure/postgres/init, hence the load restrictor;
#    plain `kubectl apply -k` does not accept the flag, so we pipe `kubectl kustomize`)
kubectl kustomize k8s/postgres/migrations/init --load-restrictor=LoadRestrictionsNone | kubectl apply -f -
kubectl -n app wait --for=condition=complete --timeout=120s job/postgres-init-migration

# 5. app stack (configmap, secret, services, deployments, gateway)
kubectl apply -k k8s/app

# 6. wait and smoke-test
kubectl -n app rollout status deploy/auth deploy/server deploy/data-service deploy/client deploy/gateway
curl -fsS http://localhost/_gateway/health
```

## Building and pushing images

```bash
scripts/ghcr.deploy.sh apps/node/client
scripts/ghcr.deploy.sh apps/node/server
scripts/ghcr.deploy.sh apps/node/data-service
scripts/ghcr.deploy.sh apps/go/auth
scripts/ghcr.deploy.sh packages/go/openresty-discovery
```

## Service map (resolved by the discovery sidecar)

| upstream                | port | k8s service     |
|-------------------------|------|-----------------|
| client_backend          | 3000 | client          |
| server_backend          | 3001 | server          |
| auth_backend            | 3002 | auth            |
| data_service_backend    | 3003 | data-service    |
