# deploys the stack into the local k3d cluster from locally built app images,
# infrastructure images are pulled from docker hub
def main [] {
    let images = [
        'ghcr.io/neoplasmes/qualification_work/apps_auth:custom'
        'ghcr.io/neoplasmes/qualification_work/apps_server:custom'
        'ghcr.io/neoplasmes/qualification_work/apps_data-service:custom'
        'ghcr.io/neoplasmes/qualification_work/apps_client:custom'
        'ghcr.io/neoplasmes/qualification_work/apps_openresty-discovery:custom'
    ]
    # direct mode streams into the nodes, the default tools mode hangs on large images
    ^k3d image import --cluster local-development --mode direct ...$images

    ^kubectl apply -f env/k8s/app/namespace.yaml

    # the jwt key is generated once and kept in the cluster
    let hasKey = (do { ^kubectl -n app get secret auth-jwt-key } | complete).exit_code == 0
    if not $hasKey {
        let keyFile = (mktemp -t jwt.XXXXXX.pem)
        ^openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $keyFile
        ^kubectl -n app create secret generic auth-jwt-key $'--from-file=jwt.private.pem=($keyFile)'
        rm $keyFile
    }

    ^kubectl kustomize env/k8s/local --load-restrictor=LoadRestrictionsNone | ^kubectl apply -f -
    ^kubectl -n app rollout status statefulset/postgres statefulset/kafka --timeout=300s
    ^kubectl -n app rollout status deploy/redis deploy/auth deploy/server deploy/data-service deploy/client deploy/gateway --timeout=300s
}
