# Build from the workspace root: docker build -f apps/openresty-discovery/Dockerfile .
#
# Disk: sources are bind-mounted, the module and build caches are cache mounts shared
# with other Go images, so the build stage keeps only the binary. go.sum is used as is:
# no `go mod tidy` during the build.

FROM golang:1.27.1-alpine AS build

RUN --mount=type=bind,source=apps/openresty-discovery,target=/src \
    --mount=type=cache,id=go-mod,target=/go/pkg/mod,sharing=locked \
    --mount=type=cache,id=go-build,target=/root/.cache/go-build,sharing=locked \
    cd /src && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags='-s -w' -o /discovery .

FROM gcr.io/distroless/static-debian12:latest

COPY --from=build /discovery /discovery

ENTRYPOINT ["/discovery"]
