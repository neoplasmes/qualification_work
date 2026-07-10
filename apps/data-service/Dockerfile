# Build from the workspace root: docker build -f apps/data-service/Dockerfile .
#
# moon decides what goes into the image (moon docker scaffold), pnpm installs only
# the app's subtree from a shared store, moon runs the same build task as locally,
# pnpm deploy produces a self-contained production folder.

ARG NODE_VERSION=24.21.0
ARG ALPINE_VERSION=3.23
# keep in sync with .prototools
ARG PNPM_VERSION=11.1.2
ARG MOON_VERSION=2.6.0
ARG NU_VERSION=0.116.0

ARG MOON_PROJECT=data-service
ARG PNPM_PACKAGE=data-service

#### tools: moon and nu (task shell) binaries, checksum-verified; nothing else is kept.
#### busybox wget/tar only: no package index downloads
FROM alpine:${ALPINE_VERSION} AS tools
ARG MOON_VERSION
ARG NU_VERSION
ARG TARGETARCH
RUN set -eu; \
    fetch() { for i in 1 2 3 4 5; do wget -q -O "$2" "$1" && return 0; echo "retry $i: $1" >&2; sleep 3; done; return 1; }; \
    case "$TARGETARCH" in amd64) a=x86_64 ;; arm64) a=aarch64 ;; *) echo "unsupported arch $TARGETARCH" >&2; exit 1 ;; esac; \
    mkdir -p /tools; cd /tmp; \
    m="moon_cli-$a-unknown-linux-musl.tar.xz"; \
    fetch "https://github.com/moonrepo/moon/releases/download/v$MOON_VERSION/$m" "$m"; \
    fetch "https://github.com/moonrepo/moon/releases/download/v$MOON_VERSION/$m.sha256" moon.sha256; \
    echo "$(head -c 64 moon.sha256)  $m" | sha256sum -c -; \
    tar -xJf "$m" -C /tools --strip-components=1 "${m%.tar.xz}/moon"; \
    n="nu-$NU_VERSION-$a-unknown-linux-musl.tar.gz"; \
    fetch "https://github.com/nushell/nushell/releases/download/$NU_VERSION/$n" "$n"; \
    fetch "https://github.com/nushell/nushell/releases/download/$NU_VERSION/SHA256SUMS" nu.sha256; \
    echo "$(grep " $n\$" nu.sha256 | head -c 64)  $n" | sha256sum -c -; \
    tar -xzf "$n" -C /tools --strip-components=1 "${n%.tar.gz}/nu"; \
    rm -f /tmp/*

#### base: node + pinned pnpm; moon and nu are mounted from `tools`, not copied
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
ARG PNPM_VERSION
ENV CI=true \
    PNPM_HOME=/pnpm \
    MOON_TOOLCHAIN_FORCE_GLOBALS=true
ENV PATH="/opt/tools:$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# Hardlinks identical files under a directory (same content and mode). pnpm used to do
# this through its store; with the store in a cache mount it copies, so /out would
# carry every duplicate file twice.
COPY <<'EOF' /usr/local/lib/hardlink-duplicates.mjs
import { createHash } from 'node:crypto';
import { linkSync, lstatSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const seen = new Map();
let linked = 0;
const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.isFile()) {
            const { size, mode } = lstatSync(path);
            if (size === 0) continue;
            const key = `${size}:${mode}:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
            const first = seen.get(key);
            if (first) {
                unlinkSync(path);
                linkSync(first, path);
                linked++;
            } else seen.set(key, path);
        }
    }
};
walk(process.argv[2]);
console.log(`hardlinked ${linked} duplicate files`);
EOF

#### skeleton: moon computes which manifests and sources the image needs.
#### The repository is bind-mounted, so it never becomes a layer.
FROM base AS skeleton
ARG MOON_PROJECT
RUN --mount=type=bind,target=/repo,rw \
    --mount=type=bind,from=tools,source=/tools,target=/opt/tools \
    --mount=type=cache,id=moon-home,target=/root/.moon,sharing=locked \
    --mount=type=cache,id=moon-wasmtime,target=/root/.cache/wasmtime,sharing=locked \
    cd /repo && moon docker scaffold ${MOON_PROJECT} && cp -R .moon/docker /skeleton

#### build: one step so the layer keeps only /out: install the app's subtree from the
#### shared store, build through moon, deploy production files, drop the workspace
FROM base AS build
ARG MOON_PROJECT
ARG PNPM_PACKAGE
COPY --from=skeleton /skeleton/configs/ ./
COPY --from=skeleton /skeleton/sources/ ./
RUN --mount=type=bind,from=tools,source=/tools,target=/opt/tools \
    --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    --mount=type=tmpfs,target=/root/.cache/pnpm \
    --mount=type=cache,id=moon-home,target=/root/.moon,sharing=locked \
    --mount=type=cache,id=moon-wasmtime,target=/root/.cache/wasmtime,sharing=locked \
    set -eu; \
    pnpm install --frozen-lockfile --prefer-offline --ignore-scripts --filter "${PNPM_PACKAGE}..."; \
    moon run "${MOON_PROJECT}:build" --no-actions; \
    pnpm --filter "${PNPM_PACKAGE}" deploy --prod --ignore-scripts --config.inject-workspace-packages=true /out; \
    rm -f /out/pnpm-lock.yaml /out/pnpm-workspace.yaml; \
    node /usr/local/lib/hardlink-duplicates.mjs /out; \
    cd /; rm -rf /app

#### runner: production image, no moon, no pnpm, no build tools
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

WORKDIR /app

COPY --from=build --chown=node:node /out .

# pending-merge tmp storage. node user must own it for write access
RUN mkdir -p /tmp/datasets && chown -R node:node /tmp/datasets

ENV NODE_ENV=production
ENV DATA_SERVICE_PORT=3003
ENV MERGE_TMP_DIR=/tmp/datasets
EXPOSE 3003

USER node

CMD ["node", "dist/index.js"]
