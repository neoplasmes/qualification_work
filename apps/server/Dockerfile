# Запускать только из корня монорепы

FROM node:24.14.0-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/eslint-plugin-fsd/package.json ./packages/eslint-plugin-fsd/

RUN pnpm install --frozen-lockfile

COPY apps/server/ ./apps/server/
# Сервер пока что не зависит от пакетов.
# COPY packages/ ./packages/

RUN pnpm --filter=server build

FROM node:24.14.0-alpine

RUN corepack enable && corepack prepare pnpm@10.32.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/server/package.json ./apps/server/
# только пакаге.джсон для полноты картины
COPY packages/eslint-plugin-fsd/package.json ./packages/eslint-plugin-fsd/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 4000

# best practices. adduser потому что alpine
# RUN adduser -D app
# USER app

CMD ["node", "apps/server/dist/index.js"]
