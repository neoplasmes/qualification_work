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
RUN pnpm -F client... install --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY apps/node/client/                 ./apps/node/client/
COPY packages/node/eslint-plugin-fsd/  ./packages/node/eslint-plugin-fsd/
COPY packages/node/primitive-server/   ./packages/node/primitive-server/

RUN pnpm --filter=primitive-server build && pnpm --filter=client build

FROM builder AS pruned

# --offline reuses the pnpm store populated by deps stage — no network calls
RUN pnpm --filter=client deploy -P --legacy --ignore-scripts /deploy

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

COPY --from=pruned /deploy .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
