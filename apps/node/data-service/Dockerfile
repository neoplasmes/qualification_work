ARG NODE_VERSION=24.14.0-alpine3.23
ARG PNPM_VERSION=10.33.0

FROM node:${NODE_VERSION} AS base

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

ENV CI=true