# Run only from the workspace root

ARG NODE_VERSION=24.14.0-alpine3.23
ARG PNPM_VERSION=10.33.0

FROM node:${NODE_VERSION} AS base

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# disable lefthook scripts
ENV CI=true

FROM base AS deps

COPY package.json tsconfig.json                    ./
COPY pnpm-lock.yaml pnpm-workspace.yaml            ./
COPY apps/node/client/package.json                 ./apps/node/client/
COPY packages/node/eslint-plugin-fsd/package.json  ./packages/node/eslint-plugin-fsd/
COPY packages/node/primitive-server/package.json   ./packages/node/primitive-server/

# we are disabling postinstall scripts natively integrated in npm among which we have "prepare"
RUN pnpm -F client... i --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY apps/node/client/                 ./apps/node/client/
COPY packages/node/eslint-plugin-fsd/  ./packages/node/eslint-plugin-fsd/
COPY packages/node/primitive-server/   ./packages/node/primitive-server/

# explanation: <pattern>... - these 3 dots means that build command will be performed for "client" package
# and all packages from which "client" depends.
# --if-present: Avoid exiting with a non-zero exit code when the script is undefined
# thus, there will be built ALL packages for "client", so yeah, we managed to save a whole 15 characters
RUN pnpm -F client... --if-present build

FROM builder AS pruned

RUN pnpm -F client deploy -P --legacy --ignore-scripts /deploy

FROM node:${NODE_VERSION} AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

WORKDIR /app

COPY --from=pruned --chown=node:node /deploy .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
