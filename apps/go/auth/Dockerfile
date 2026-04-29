# run only from the root of the repo

ARG GO_VERSION=1.26.3

FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src
COPY apps/go/auth/go.mod apps/go/auth/go.sum ./
RUN go mod download

COPY apps/go/auth/cmd ./cmd
COPY apps/go/auth/internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o ./bin/auth ./cmd/auth

FROM gcr.io/distroless/static-debian12:nonroot

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

COPY --from=builder /src/bin/auth /auth

ENV AUTH_PORT=3002
EXPOSE 3002

USER nonroot
ENTRYPOINT ["/auth"]
