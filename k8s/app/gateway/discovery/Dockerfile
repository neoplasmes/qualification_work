FROM golang:1.23-alpine AS build
WORKDIR /src

COPY k8s/app/gateway/discovery/go.mod ./
COPY k8s/app/gateway/discovery/*.go ./

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags='-s -w' -o /discovery .

FROM gcr.io/distroless/static-debian12:latest

COPY --from=build /discovery /discovery

ENTRYPOINT ["/discovery"]
