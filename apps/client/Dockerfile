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

COPY package.json tsconfig.json                    ./
COPY pnpm-lock.yaml pnpm-workspace.yaml            ./
COPY apps/client/package.json                 ./apps/client/
COPY packages/types/package.json              ./packages/types/
COPY packages/eslint-plugin-fsd/package.json  ./packages/eslint-plugin-fsd/
COPY packages/primitive-server/package.json   ./packages/primitive-server/

# we are disabling postinstall scripts natively integrated in npm among which we have "prepare"
RUN pnpm -F client... i --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY apps/client/                 ./apps/client/
COPY packages/types/              ./packages/types/
COPY packages/eslint-plugin-fsd/  ./packages/eslint-plugin-fsd/
COPY packages/primitive-server/   ./packages/primitive-server/

# build the runtime package before its consumer
# pnpm exec resolves the tool from workspace dependencies
# each command runs inside its package
# keep the host bundle before vite because tsup cleans dist
RUN pnpm -F primitive-server exec tsup && pnpm -F client exec tsup && cp apps/client/server/renderError.html apps/client/dist/ && pnpm -F client exec vite build --ssr src/entry.server.tsx --outDir dist/server && pnpm -F client exec vite build

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
