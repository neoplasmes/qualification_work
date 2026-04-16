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
COPY apps/node/server/package.json                  ./apps/node/server/
COPY packages/node/types/package.json               ./packages/node/types/
COPY packages/node/eslint-plugin-fsd/package.json   ./packages/node/eslint-plugin-fsd/
COPY packages/node/primitive-server/package.json    ./packages/node/primitive-server/

# we are disabling postinstall scripts natively integrated in npm among which we have "prepare"
# then we have to rebuild argon2 because it needs a native binary
RUN pnpm -F server... install --frozen-lockfile --ignore-scripts && pnpm rebuild argon2

FROM deps AS builder

COPY apps/node/server/               ./apps/node/server/
COPY packages/node/types/            ./packages/node/types/
COPY packages/node/primitive-server/ ./packages/node/primitive-server/

RUN pnpm -F primitive-server build && pnpm --filter=server build

FROM builder AS pruned

RUN pnpm -F server deploy -P --legacy --ignore-scripts /deploy

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

COPY --from=pruned /deploy .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
