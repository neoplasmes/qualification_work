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