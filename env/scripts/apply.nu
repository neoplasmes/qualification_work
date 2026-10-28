# applies the whole stack to the current kubectl context, as in env/cluster/README.md
def main [] {
    if ($env.POSTGRES_PASSWORD? | default '') == '' {
        error make {msg: 'POSTGRES_PASSWORD is required'}
    }

    ^kubectl apply -f env/cluster/app/namespace.yaml
    ^kubectl apply -f env/cluster/ghcr/secret.yaml
    ^helmfile -f env/cluster/helmfile.yaml.gotmpl apply
    ^kubectl kustomize env/cluster/postgres/migrations/init --load-restrictor=LoadRestrictionsNone | ^kubectl apply -f -
    ^kubectl -n app wait --for=condition=complete --timeout=120s job/postgres-init-migration
    ^kubectl apply -k env/cluster/app
    ^kubectl -n app rollout status deploy/auth deploy/server deploy/data-service deploy/client deploy/gateway
}
