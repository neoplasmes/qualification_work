# Run only from the workspace root

ARG NODE_VERSION=24.21.0-alpine3.23
ARG PNPM_VERSION=11.1.2

FROM node:${NODE_VERSION} AS base

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# disable interactive installation prompts
ENV CI=true

FROM base AS deps

COPY package.json tsconfig.json                         ./
COPY pnpm-lock.yaml pnpm-workspace.yaml                 ./
COPY apps/data-service/package.json                ./apps/data-service/
COPY packages/types/package.json                   ./packages/types/
COPY packages/eslint-plugin-fsd/package.json       ./packages/eslint-plugin-fsd/
COPY packages/primitive-server/package.json        ./packages/primitive-server/
COPY packages/microservice-config/package.json     ./packages/microservice-config/
COPY packages/microservice-utils/package.json      ./packages/microservice-utils/

RUN pnpm -F data-service... i --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY apps/data-service/            ./apps/data-service/
COPY packages/types/               ./packages/types/
COPY packages/primitive-server/    ./packages/primitive-server/
COPY packages/microservice-config/ ./packages/microservice-config/
COPY packages/microservice-utils/  ./packages/microservice-utils/

RUN pnpm -F primitive-server exec tsup && pnpm -F data-service exec tsup

FROM builder AS pruned

RUN pnpm -F data-service deploy -P --legacy --ignore-scripts /deploy

FROM node:${NODE_VERSION} AS runner

LABEL org.opencontainers.image.source=https://github.com/neoplasmes/qualification_work

WORKDIR /app

COPY --from=pruned --chown=node:node /deploy .

# pending-merge tmp storage. node user must own it for write access
RUN mkdir -p /tmp/datasets && chown -R node:node /tmp/datasets

ENV NODE_ENV=production
ENV DATA_SERVICE_PORT=3003
ENV MERGE_TMP_DIR=/tmp/datasets
EXPOSE 3003

USER node

CMD ["node", "dist/index.js"]
