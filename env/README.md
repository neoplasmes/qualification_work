# Environment

Environment configuration follows the layout used in `third_course_reimagined`:

| Directory | Responsibility |
| --- | --- |
| `local/` | Compose files split into database, cache, and broker groups |
| `postgres/` | Database bootstrap SQL and the migration runner |
| `pgbouncer/` | Connection pool configuration and local user list |
| `k8s/` | Kubernetes manifests, Helm values, k3d configuration, cluster operations |
| `docker/` | Building and publishing application images |

## Local development

Run commands from the workspace root:

```sh
moon run env:compose-up
moon run env:compose-logs
moon run env:compose-down
```

The stack starts PostgreSQL, PgBouncer, Redis, Redis Insight, and Kafka.
Applications run through their own development tasks. The Compose project name
remains `local`, preserving the existing named volumes and container names.
Stop commands retain named data volumes.

Start or stop individual groups with `env:compose-up-database`,
`env:compose-down-database`, `env:compose-up-cache`, `env:compose-down-cache`,
`env:compose-up-broker`, and `env:compose-down-broker`.

PgBouncer requires the ignored `pgbouncer/userlist.txt`, with
`pgbouncer/userlist.example.txt` as its template. Kubernetes secrets and private
Helm values remain ignored under `k8s/`.

## Validation

```sh
moon run env:lint root:lint-nu
```

Validation renders Kubernetes manifests and checks Compose configuration and
bind sources, including consumers in applications and E2E environments. It does
not start containers, execute tests, publish images, or apply cluster resources.
Local Kubernetes secrets and PgBouncer credentials must already exist.

## Cluster and delivery

Use `env:cluster-up`, `env:cluster-start`, `env:cluster-stop`, and
`env:cluster-down` for k3d lifecycle operations. `env:deploy` builds and publishes
images to GHCR. `env:apply` installs the stack in the current Kubernetes context;
`env:migrate` reruns the database bootstrap job. See [k8s/README.md](k8s/README.md)
for prerequisites and deployment details.
