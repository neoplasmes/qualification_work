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

COPY package.json tsconfig.json                     ./
COPY pnpm-lock.yaml pnpm-workspace.yaml             ./
COPY apps/node/server/package.json                      ./apps/node/server/
COPY packages/node/types/package.json                   ./packages/node/types/
COPY packages/node/eslint-plugin-fsd/package.json       ./packages/node/eslint-plugin-fsd/
COPY packages/node/primitive-server/package.json        ./packages/node/primitive-server/
COPY packages/node/microservice-config/package.json     ./packages/node/microservice-config/

# we are disabling postinstall scripts natively integrated in npm among which we have "prepare"
# then we have to rebuild argon2 because it needs a native binary
RUN pnpm -F server... i --frozen-lockfile --ignore-scripts && pnpm rebuild argon2

FROM deps AS builder

COPY apps/node/server/               ./apps/node/server/
COPY packages/node/types/            ./packages/node/types/
COPY packages/node/primitive-server/ ./packages/node/primitive-server/
COPY packages/node/microservice-config/ ./packages/node/microservice-config/

RUN pnpm -F server... --if-present build

FROM builder AS pruned

RUN pnpm -F server deploy -P --legacy --ignore-scripts /deploy

FROM node:${NODE_VERSION} AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

WORKDIR /app

COPY --from=pruned --chown=node:node /deploy .

ENV NODE_ENV=production
ENV SERVER_PORT=3001
EXPOSE 3001

USER node

CMD ["node", "dist/index.js"]
