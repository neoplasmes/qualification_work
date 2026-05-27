# Qualification work

## Contents

- [Environment setup](#commands-for-configuring-k3s-environment)
- [Build and push images](#to-build-image-locally-and-push-to-ghcrio)
- [Local run with k3d](#to-run-k3d-locally)
- [Important notes](#important-notes)
- [Deployment](#deployment)
  - [Single beefy machine](#single-beefy-machine)
  - [Three-node cluster (1 control-plane + agent, 2 agents)](#three-node-cluster-1-control-plane--agent-2-agents)
  - [Tuning resource limits and replicas](#tuning-resource-limits-and-replicas)
- [Monorepo layout](#monorepo-layout)
- [Tech stack](#tech-stack)

node.js version - 24.14.0 (LTS на март 2026)

### commands for configuring k3s environment:

1. kubectl (kubernetes control) installation:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client
```

2. Helm (k8s package manager) installation:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

3. k3d (k3s in docker - for local development) installation
```bash
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
k3d version
```

to create local cluster - use `moon run k3s-local-create`

4. Helmfile (tool for replayable helm's installations) installation:
```bash
# you will need mise package manager
mise use -g helmfile@latest

# plugin for helmfile's normal work
helm plugin install https://github.com/databus23/helm-diff

# check:
cd k8s
helmfile list
```

### To build image locally and push to ghcr.io

1. login to ghcr.io registry via `docker login`
2. `chmod +x ./scripts/ghcr.deploy.sh`
3. use `moon run deploy-to-registry -- <path-to-dockerfile>`


### To run k3d locally:

At first, you have to get token for pulling images from repository, or change container registry in k8s files to yours, push all images to your registry via `/scripts/ghcr.deploy.sh` and then generate ghcr/secret.yaml with the following command:

```bash
kubectl create secret docker-registry ghcr-secret \
    --namespace app \
    --docker-server=ghcr.io \
    --docker-username=<github-username> \
    --docker-password=<github-token> \
    --docker-email=<email> \
    --dry-run=client \
    -o yaml > k8s/ghcr/secret.yaml
```

Then you can run:

```bash
k3d cluster create --config k8s/k3d.config.yaml

kubectl apply -f k8s/app/namespace.yaml
kubectl apply -f k8s/app/secret.yaml
kubectl apply -f k8s/app/configmap.yaml

cd k8s && helmfile apply

kubectl apply -f k8s/app/
```


# IMPORTANT NOTES

1. Each connection is a socket, so it's a file descriptor. Thus, we have to ensure that on our hosting sustems there is no limit for this. `ulimit -n 1000000`

# Deployment

Same manifests under `k8s/` work on real k3s. Two recipes below: a single-node install and a three-node cluster sized for 4 vCPU / 8 GB RAM / 20 GB SSD VPS instances.

Before either recipe, push images to ghcr and prepare credentials:

```bash
# from the repo root
scripts/ghcr.deploy.sh apps/node/client
scripts/ghcr.deploy.sh apps/node/server
scripts/ghcr.deploy.sh apps/node/data-service
scripts/ghcr.deploy.sh apps/go/auth
scripts/ghcr.deploy.sh packages/go/openresty-discovery

# build k8s/ghcr/secret.yaml as shown above
# build k8s/app/secret.yaml from k8s/app/secret.example.yaml
# generate the JWT private key for the auth service
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /tmp/jwt.private.pem
```

## Single beefy machine

Use this when one host runs everything (control-plane + workloads).

```bash
# 1. install k3s with traefik disabled (the manifests bring their own openresty gateway)
curl -sfL https://get.k3s.io | sh -s - --disable=traefik --write-kubeconfig-mode=644
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown $USER ~/.kube/config

# 2. namespace + ghcr pull secret + jwt secret
kubectl apply -f k8s/app/namespace.yaml
kubectl apply -f k8s/ghcr/secret.yaml
kubectl -n app create secret generic auth-jwt-key \
  --from-file=jwt.private.pem=/tmp/jwt.private.pem

# 3. shared env so postgres/redis charts can find their credentials
kubectl apply -f k8s/app/secret.yaml -f k8s/app/configmap.yaml

# 4. postgres + redis (bitnami charts via helmfile)
export POSTGRES_PASSWORD=<value matching k8s/app/secret.yaml>
helmfile -f k8s/helmfile.yaml.gotmpl apply

# 5. apply schema migrations once postgres is ready
kubectl kustomize k8s/postgres/migrations/init --load-restrictor=LoadRestrictionsNone | kubectl apply -f -
kubectl -n app wait --for=condition=complete --timeout=120s job/postgres-init-migration

# 6. application stack
kubectl apply -k k8s/app
kubectl -n app rollout status deploy/auth deploy/server deploy/data-service deploy/client deploy/gateway
```

The gateway exposes port 80 through k3s' built-in service load balancer (`servicelb`). Point your DNS A-record at the machine and you are done.

## Three-node cluster (1 control-plane + agent, 2 agents)

Three identical VPS, 4 vCPU / 8 GB RAM / 20 GB SSD each:

| Node  | Role                                | Pinned workloads                                  |
|-------|-------------------------------------|---------------------------------------------------|
| `n1`  | k3s server (control-plane + agent)  | `postgres` (PVC), 1x server, 1x data-service, 1x auth, 1x client, 1x gateway |
| `n2`  | k3s agent                           | `redis` (PVC), 1x server, 1x data-service, 1x auth, 1x client, 1x gateway |
| `n3`  | k3s agent                           | 1x server, 1x data-service                         |

Storage backend is `local-path` (default in k3s), so a PVC binds to whichever node the pod first lands on. To keep `postgres` on `n1` and `redis` on `n2` we label the nodes and set `nodeSelector` in the chart values (see Step 5).

### 1. Install k3s

On `n1` (the control-plane, which also runs the agent role by default):

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --disable=traefik \
  --write-kubeconfig-mode=644 \
  --node-name=n1
sudo cat /var/lib/rancher/k3s/server/node-token   # copy the token
```

On `n2` and `n3` (replace `<n1-ip>` and `<token>`):

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<n1-ip>:6443 K3S_TOKEN=<token> sh -s - agent \
  --node-name=n2   # or n3
```

Verify from `n1`:

```bash
kubectl get nodes -o wide
```

Copy `/etc/rancher/k3s/k3s.yaml` from `n1` to your workstation, replace `127.0.0.1` in the `server:` field with `n1`'s public IP, and use it as `~/.kube/config`.

### 2. Label nodes for storage placement

```bash
kubectl label node n1 workload-zone=db-primary
kubectl label node n2 workload-zone=db-cache
```

### 3. Prerequisites (namespace, secrets, configmap)

Identical to the single-node case:

```bash
kubectl apply -f k8s/app/namespace.yaml
kubectl apply -f k8s/ghcr/secret.yaml
kubectl -n app create secret generic auth-jwt-key \
  --from-file=jwt.private.pem=/tmp/jwt.private.pem
kubectl apply -f k8s/app/secret.yaml -f k8s/app/configmap.yaml
```

### 4. OS-level limits (do this on every node)

Each connection eats a file descriptor; bump the defaults before pushing load.

```bash
echo '* hard nofile 1048576' | sudo tee -a /etc/security/limits.conf
echo '* soft nofile 1048576' | sudo tee -a /etc/security/limits.conf
sudo sysctl -w net.core.somaxconn=65535 net.ipv4.tcp_max_syn_backlog=65535
```

### 5. Pin postgres and redis with helmfile overrides

Edit `k8s/postgres/values.yaml` to add:

```yaml
primary:
  nodeSelector:
    workload-zone: db-primary
  resources:
    requests: { cpu: "500m", memory: "1Gi" }
    limits:   { cpu: "1500m", memory: "2Gi" }
```

Edit `k8s/redis/values.yaml`:

```yaml
master:
  nodeSelector:
    workload-zone: db-cache
  resources:
    requests: { cpu: "100m", memory: "256Mi" }
    limits:   { cpu: "500m", memory: "512Mi" }
```

Apply postgres + redis:

```bash
export POSTGRES_PASSWORD=<value matching k8s/app/secret.yaml>
helmfile -f k8s/helmfile.yaml.gotmpl apply
```

### 6. Schema migrations

```bash
kubectl kustomize k8s/postgres/migrations/init --load-restrictor=LoadRestrictionsNone | kubectl apply -f -
kubectl -n app wait --for=condition=complete --timeout=120s job/postgres-init-migration
```

### 7. Scale stateless deployments for load testing

The defaults are `replicas: 1`. For three nodes, scale so each pod tier spreads evenly and add a topology spread constraint so the scheduler keeps replicas off the same node when possible. Patch the deployments via a kustomize overlay or `kubectl scale`:

```bash
kubectl apply -k k8s/app

kubectl -n app scale deploy/server       --replicas=3
kubectl -n app scale deploy/data-service --replicas=3
kubectl -n app scale deploy/auth         --replicas=2
kubectl -n app scale deploy/client       --replicas=2
kubectl -n app scale deploy/gateway      --replicas=2

kubectl -n app rollout status deploy/auth deploy/server deploy/data-service deploy/client deploy/gateway
```

To make the spread deterministic, add this block to each Deployment's `spec.template.spec` (or via a kustomize patch):

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: <server | data-service | client | auth | gateway>
```

### 8. Expose the gateway

k3s ships with `servicelb` (klipper-lb) - the existing `gateway` Service of type `LoadBalancer` already grabs ports 80 on every node. Point a DNS A-record (or three) at the node IPs, or put a single L4 LB (Cloudflare/Hetzner LB) in front of `n1/n2/n3:80`.

### Per-node budget after this layout

Eyeballing the totals on `n1` (the heaviest node, since it hosts the control plane and postgres):

| Component                | RAM request | RAM limit | CPU request | CPU limit |
|--------------------------|-------------|-----------|-------------|-----------|
| k3s server + agent       | ~700 Mi     | -         | ~500 m      | -         |
| postgres                 | 1 Gi        | 2 Gi      | 500 m       | 1500 m    |
| 1x server                | 128 Mi      | 256 Mi    | 500 m       | 500 m     |
| 1x data-service          | 192 Mi      | 512 Mi    | 500 m       | 1000 m    |
| 1x auth                  | 64 Mi       | 192 Mi    | 200 m       | 500 m     |
| 1x client                | 128 Mi      | 256 Mi    | 500 m       | 500 m     |
| 1x gateway (2 ctrs)      | 80 Mi       | 192 Mi    | 60 m        | 300 m     |
| **Sum (requests)**       | **~2.3 Gi** |           | **~2.8 cpu**|           |
| **Headroom (8 GB host)** | **~5.7 Gi** |           | **~1.2 cpu**|           |

`n3` is the lightest (server + data-service only) and leaves plenty of headroom for replicating data-service further during the load test.

## Tuning resource limits and replicas

Every container in `k8s/app/**/deployment.yaml` has explicit `resources.requests` and `resources.limits`. Two ways to change them.

### One-off (live cluster)

```bash
# bump data-service memory limit on the fly
kubectl -n app set resources deploy/data-service \
  --containers=data-service \
  --limits=memory=1Gi,cpu=1500m \
  --requests=memory=384Mi,cpu=750m

# add or remove replicas
kubectl -n app scale deploy/server --replicas=4
```

These edits do not persist - the next `kubectl apply -k k8s/app` reverts them.

### Persisted (via manifests)

Edit the relevant deployment, e.g. `k8s/app/data-service/deployment.yaml`:

```yaml
resources:
  requests:
    memory: "384Mi"
    cpu: "750m"
  limits:
    memory: "1Gi"
    cpu: "1500m"
```

Then `kubectl apply -k k8s/app` rolls the pods out with the new values.

Postgres and redis resources live inside the helm chart values:

- `k8s/postgres/values.yaml` -> `primary.resources`
- `k8s/redis/values.yaml` -> `master.resources`

After editing, rerun `helmfile -f k8s/helmfile.yaml.gotmpl apply`.

### Sizing hints

- `data-service` is the hungriest tier: it streams CSV/XLSX through memory during merge sessions. Under load testing, raise its memory limit to `1 Gi` and CPU limit to `1500-2000 m` before scaling replicas.
- `server` is mostly I/O-bound (auth, postgres roundtrips). CPU scales linearly with request rate; memory rarely climbs above 200 Mi.
- `auth` is the cheapest tier (Go, distroless). 64 Mi is enough; the JWT verifier is the only hot path.
- `client` SSR keeps a small Vite renderer pool. CPU spikes on cold renders, then plateaus.
- `gateway` (openresty) is happy with 128 Mi unless `proxy_cache` grows; the discovery sidecar is a constant 20-30 Mi.

### How to watch what you set

```bash
# per-pod actual usage (needs metrics-server, which is preinstalled in k3s)
kubectl top pods -n app

# QoS class and effective limits
kubectl -n app get pod -l app=data-service -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].resources}{"\n"}{end}'

# events for OOMKills and throttling
kubectl get events -n app --field-selector reason=OOMKilling
```

If a pod is repeatedly OOMKilled, bump `limits.memory`. If CPU throttling shows up in `kubectl top` (usage stuck at the limit), raise `limits.cpu` or scale replicas.

# Monorepo layout

Two language workspaces sit side by side: Node packages are wired through `pnpm` workspaces + catalogs (`pnpm-workspace.yaml`); Go modules use their own `go.mod` per project. `moon` runs tasks across both.

```
.
├── apps/
│   ├── node/
│   │   ├── client/         SSR React frontend (Vite + custom Node SSR entrypoint)
│   │   ├── server/         BFF/API gateway facing the client; auth + dashboards + chart proxying
│   │   └── data-service/   Domain microservice: datasets, rows, charts, merges, CSV/XLSX ingest
│   └── go/
│       └── auth/           JWT issuer + session store; RSA keys, Postgres, Redis (gin)
├── packages/
│   ├── node/
│   │   ├── primitive-server/        Zero-dep HTTP framework used by server + data-service
│   │   ├── microservice-utils/      Shared utilities: zod parsing, pg helpers, internal JWT verify
│   │   ├── microservice-config/     Reusable tsconfig/oxlint/prettier/vitest presets
│   │   ├── redis-cache/             Thin cache layer over node-redis (catalog version)
│   │   ├── types/                   Cross-service domain types
│   │   └── eslint-plugin-fsd/       Local oxlint plugin enforcing FSD layer boundaries
│   └── go/
│       └── openresty-discovery/     k8s-aware sidecar that rewrites the OpenResty upstream list
├── e2e/
│   ├── backend/                     vitest-driven HTTP scenarios against the running stack
│   ├── frontend/                    Playwright scenarios with per-test docker-compose fixtures
│   └── docker-compose/              Compose definition + keys + openresty/pgbouncer config used by e2e
├── infrastructure/                  Postgres schema + PgBouncer config baked into images
├── k8s/                             Manifests + helmfile for k3s (single-node + multi-node recipes)
├── deploy/                          Compose-based VPS deploy recipes (currently client)
├── scripts/                         ghcr.io image push, kustomize-driven migration apply
└── generation/                      Code-gen utilities (e.g. tests / fixtures)
```

Service-side architecture is hexagonal: each Node service has `core/` (domain + ports), `adapters/driven/` (Postgres repos, Redis cache, tmp storage), `adapters/driving/` (HTTP handlers via `primitive-server`). The Go auth service follows the same split (`internal/core` + `internal/adapters`).

# Tech stack

**Frontend** (`apps/node/client`)
- React 19 + React Router 7 with custom Node SSR entrypoint (Vite SSR build, hydration via `entry.client.tsx`)
- Redux Toolkit + RTK Query for data fetching and tag-based cache invalidation
- Visx for charts (line/bar/heatmap/pie); `@glideapps/glide-data-grid` for the dataset grid
- SCSS modules + Stylelint; lucide-react icons; framer/motion for transitions
- FSD architecture enforced by a local oxlint plugin

**Backend** (`apps/node/server`, `apps/node/data-service`)
- TypeScript 6 on Node 24 LTS, ESM only
- `primitive-server` (in-house, zero-dep HTTP framework) instead of Fastify/Express
- Postgres via `pg` (catalog-pinned) over PgBouncer; Redis via `node-redis`
- `csv-parse` + `exceljs` for ingestion; streaming merges with on-disk tmp storage
- `zod` validation; `jose` for internal service-to-service JWTs

**Auth service** (`apps/go/auth`)
- Go 1.26 + gin; `pgx/v5` for Postgres, `go-redis/v9` for Redis, argon2id passwords
- RS256 JWT issuance; key loaded from a k8s secret

**Edge / discovery**
- OpenResty (nginx + Lua) as the cluster ingress gateway
- `openresty-discovery` Go sidecar watches k8s endpoints and hot-reloads upstreams

**Shared platform**
- pnpm workspaces with catalog version pinning (`pg`, `redis`, `zod`, build tools)
- moon as the task runner across Node + Go packages
- oxlint (TS), Stylelint (SCSS), Prettier; commitlint + lefthook for git hooks
- vitest for unit/integration; Playwright for browser E2E
- Conventional Commits enforced by commitlint config

**Build / deploy**
- tsup for service bundles, Vite for the SSR client
- Multi-stage Dockerfiles; images published to `ghcr.io`
- k3s/k3d for orchestration; bitnami helm charts (postgres, redis) driven by helmfile
- Kustomize overlays for the application manifests; metrics-server preinstalled with k3s
