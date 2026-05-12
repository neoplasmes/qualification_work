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

COPY package.json tsconfig.json                         ./
COPY pnpm-lock.yaml pnpm-workspace.yaml                 ./
COPY apps/node/data-service/package.json                ./apps/node/data-service/
COPY packages/node/types/package.json                   ./packages/node/types/
COPY packages/node/eslint-plugin-fsd/package.json       ./packages/node/eslint-plugin-fsd/
COPY packages/node/primitive-server/package.json        ./packages/node/primitive-server/
COPY packages/node/microservice-config/package.json     ./packages/node/microservice-config/
COPY packages/node/microservice-utils/package.json      ./packages/node/microservice-utils/

RUN pnpm -F data-service... i --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY apps/node/data-service/            ./apps/node/data-service/
COPY packages/node/types/               ./packages/node/types/
COPY packages/node/primitive-server/    ./packages/node/primitive-server/
COPY packages/node/microservice-config/ ./packages/node/microservice-config/
COPY packages/node/microservice-utils/  ./packages/node/microservice-utils/

RUN pnpm -F data-service... --if-present build

FROM builder AS pruned

RUN pnpm -F data-service deploy -P --legacy --ignore-scripts /deploy

FROM node:${NODE_VERSION} AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

WORKDIR /app

COPY --from=pruned --chown=node:node /deploy .

ENV NODE_ENV=production
ENV DATA_SERVICE_PORT=3003
EXPOSE 3003

USER node

CMD ["node", "dist/index.js"]
