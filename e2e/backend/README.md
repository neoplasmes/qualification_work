Because I don't have a dev or test staging environment I had to write this thing.

## Keys guide

### JWT RSA key

Used by the auth service to sign internal JWTs.
```bash
cd e2e/backend/docker-compose/keys

openssl genrsa -out jwt.private.pem 2048
```

### TLS certificates for HTTPS gateway

The gateway (openresty) terminates TLS on port 8443. Tests connect through `https://localhost:8443`.

To generate, install mkcert and run:
```bash
mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1

cp "$(mkcert -CAROOT)/rootCA.pem" ca.pem
```

Summary:
- `localhost.pem` - server certificate, mounted into openresty
- `localhost-key.pem` - private key for the certificate, mounted into openresty
- `ca.pem` - mkcert root CA, passed to Node.js via `NODE_EXTRA_CA_CERTS` so `fetch` trusts the certificate

`NODE_EXTRA_CA_CERTS` is set automatically through `setup.ts` and moon scripts