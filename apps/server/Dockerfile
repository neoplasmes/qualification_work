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
COPY apps/server/package.json                      ./apps/server/
COPY packages/types/package.json                   ./packages/types/
COPY packages/eslint-plugin-fsd/package.json       ./packages/eslint-plugin-fsd/
COPY packages/primitive-server/package.json        ./packages/primitive-server/
COPY packages/microservice-config/package.json     ./packages/microservice-config/
COPY packages/microservice-utils/package.json      ./packages/microservice-utils/

# we are disabling postinstall scripts natively integrated in npm among which we have "prepare"
RUN pnpm -F server... i --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY apps/server/                  ./apps/server/
COPY packages/types/               ./packages/types/
COPY packages/primitive-server/    ./packages/primitive-server/
COPY packages/microservice-config/ ./packages/microservice-config/
COPY packages/microservice-utils/  ./packages/microservice-utils/

# build the runtime package before its consumer
RUN pnpm -F primitive-server exec tsup && pnpm -F server exec tsup

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
