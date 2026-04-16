node.js version - 24.14.0 (LTS на март 2026)

commands for configuring k3s environment:

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