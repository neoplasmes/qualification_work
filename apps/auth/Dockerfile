# run only from the root of the repo

ARG GO_VERSION=1.27.1

FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src
COPY apps/auth/go.mod apps/auth/go.sum ./
RUN go mod download

COPY apps/auth/cmd ./cmd
COPY apps/auth/internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o ./bin/auth ./cmd/auth

FROM gcr.io/distroless/static-debian12:nonroot AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

COPY --from=builder /src/bin/auth /auth

ENV AUTH_PORT=3002
EXPOSE 3002

USER nonroot
ENTRYPOINT ["/auth"]

FROM alpine:3.23 AS runner-dev

RUN apk add --no-cache wget

COPY --from=builder /src/bin/auth /auth

ENV AUTH_PORT=3002
EXPOSE 3002

ENTRYPOINT ["/auth"]
