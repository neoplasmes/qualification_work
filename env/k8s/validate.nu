# render manifests without contacting the cluster or printing secrets
def main [] {
    for directory in [env/k8s/app env/k8s/local env/k8s/postgres/migrations/init] {
        let result = ^kubectl kustomize $directory --load-restrictor=LoadRestrictionsNone | complete

        if $result.exit_code != 0 {
            error make {msg: $result.stderr}
        }
    }
}
