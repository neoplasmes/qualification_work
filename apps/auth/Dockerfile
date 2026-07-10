# Build from the workspace root: docker build -f apps/auth/Dockerfile .
#
# Disk: sources are bind-mounted, the module and build caches are cache mounts shared
# with other Go images, so the builder stage keeps only the binary.

ARG GO_VERSION=1.27.1

FROM golang:${GO_VERSION}-alpine AS builder

RUN --mount=type=bind,source=apps/auth,target=/src \
    --mount=type=cache,id=go-mod,target=/go/pkg/mod,sharing=locked \
    --mount=type=cache,id=go-build,target=/root/.cache/go-build,sharing=locked \
    cd /src && CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/auth ./cmd/auth

FROM gcr.io/distroless/static-debian12:nonroot AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

COPY --from=builder /out/auth /auth

ENV AUTH_PORT=3002
EXPOSE 3002

USER nonroot
ENTRYPOINT ["/auth"]

FROM alpine:3.23 AS runner-dev

RUN apk add --no-cache wget

COPY --from=builder /out/auth /auth

ENV AUTH_PORT=3002
EXPOSE 3002

ENTRYPOINT ["/auth"]
