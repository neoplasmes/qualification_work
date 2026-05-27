# Contributing

Thanks for taking the time to contribute. This document covers the workflow, tooling, and conventions used across this monorepo. For an overview of what lives where, see the [Monorepo layout](README.md#monorepo-layout) section in `README.md`.

## Prerequisites

- Node.js **24.14.0** (LTS as of March 2026); use `nvm`/`fnm`/`mise` to pin
- `pnpm@11.1.2` (the repo uses pnpm workspaces + catalogs; do not switch package manager)
- Go **1.26+** if you touch `apps/go/*` or `packages/go/*`
- Docker + Docker Compose v2 (used for local data stores and e2e fixtures)
- `moon` task runner — install via `mise use -g moon` or follow `https://moonrepo.dev/docs/install`
- Optional for k8s work: `kubectl`, `helm`, `helmfile`, `k3d` (see `README.md` for install snippets)

## First-time setup

```bash
pnpm install                       # installs all Node workspaces
moon run development-compose-up    # local Postgres + Redis on the default ports
```

The `prepare` lifecycle script installs `lefthook` git hooks automatically. If you cloned with `--no-scripts`, run `pnpm prepare` once.

## Local development

Run the whole stack with HMR:

```bash
pnpm dev:hmr   # moon run client:dev server:dev
```

Per-service dev loops (Node services use `tsx watch`):

```bash
moon run client:dev
moon run server:dev
moon run data-service:dev
moon run auth:dev      # go run ./cmd/...
```

Each service reads its own `.env` (see `*.env.example` in the service folder if present). Tests for Node services use a separate `.env.test`.

## Quality gates

Run from the repo root; `moon` fans out to every workspace.

```bash
pnpm typecheck         # tsc --noEmit across all packages
pnpm test              # vitest (Node) + go test (Go), per workspace
pnpm lint              # oxlint (TS) + stylelint (SCSS) + go vet
pnpm lint:fix          # auto-fix what is fixable
```

A failing `typecheck`, `test`, or `lint` blocks the merge. Lefthook re-runs them on staged files at commit time, so do not push past hook failures.

### E2E suites

- **Backend** (`e2e/backend`) — Vitest HTTP scenarios; spins up the compose stack defined in `e2e/docker-compose/`. Run with `pnpm --filter qualification-work-e2e-backend test`.
- **Frontend** (`e2e/frontend`) — Playwright; the global setup brings up the same stack. Run with `pnpm --filter qualification-work-e2e-frontend test` (or `test:ui` for the UI mode).

Both suites are heavy. Run them locally before opening a PR that touches HTTP contracts, auth, or merge/ingest flows.

## Branching & commits

- Branch from `main` (or `temp-main` if it is the active staging branch for an ongoing chunk of work). Name branches `feat/...`, `fix/...`, `refactor/...`, `docs/...`, `chore/...`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) — enforced by `commitlint.config.js` + the `commit-msg` lefthook. Allowed types match `@commitlint/config-conventional`: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `revert`, `style`.
- Scope the change. Examples from this repo: `feat(client): ...`, `fix(data-service): ...`, `refactor(client, server): ...`.
- **Header only — no body** unless absolutely necessary. Keep messages concise; PR descriptions carry the long-form context.
- When the same set of changes spans services, list them comma-separated in the scope.

## Code style

Formatting is non-negotiable; let the tooling handle it.

- `prettier` for everything except SCSS pure formatting (Prettier still runs on it). Config: `prettier.config.js` + `@ianvs/prettier-plugin-sort-imports` for grouping.
- `oxlint` (config at `oxlint.config.ts`) is the linter for TS/JS. Frontend additionally uses the local `@qualification-work/eslint-plugin-fsd` to enforce FSD layer boundaries (`shared` < `entities` < `features` < `widgets` < `pages` < `app`).
- `stylelint` (`stylelint-config-standard-scss`) for SCSS modules in the client.
- Go code follows `gofmt` + `go vet`.

### Comments and tests

These are the practical rules used throughout the codebase:

1. Comments and test descriptions are written in **English**.
2. Use plain hyphens (`-`), never em-dashes (`—`).
3. Never delete existing user-written comments; tweak content if context demands, but preserve the intent.
4. Comments do not end with a period; start with a lowercase letter.
5. JSDoc on exported functions/methods includes every `@param` and `@returns`. Example:
   ```ts
   /**
    * Description placeholder
    *
    * @param dashboardId
    * @param chartId
    * @param height
    * @param userOrgIds
    * @returns
    */
   ```
6. Keep comments and test descriptions short and to the point.
7. Be deliberate about performance — watch allocations, avoid quadratic loops in hot paths, prefer streaming for any user-supplied data (CSV/XLSX in particular).

### File naming

- No hyphens in source filenames. Use dots as separators (`patch.handler.ts`, `pg.dataset.repo.ts`).
- Services are suffixed `.service.ts`; repos `.repo.ts`; commands `.command.ts`; queries `.query.ts`; handlers `.handler.ts`; tests `.test.ts` / `.test.tsx`.

### Server architecture

Backend services follow a hexagonal layout:

- `core/` — domain types, ports, commands, queries (no I/O).
- `adapters/driven/` — Postgres repos, Redis cache, tmp storage, parsers. One subfolder per port (`repos/`, `tools/`).
- `adapters/driving/http/` — HTTP handlers, organised by URL segment.
- No `index.ts` at `core/` or `adapters/driven/` roots — only inside the per-segment subfolders.

### TypeScript

- Use `type` aliases by default. Use `interface` **only** when something will `implements` it (i.e. classes).
- ESM only — every package is `"type": "module"`.
- Catalog-pinned dependencies (`pg`, `redis`, `zod`, build tools) are declared as `catalog:<name>` in package manifests. Do not bump them in individual services; update the catalog in `pnpm-workspace.yaml`.

## Pull requests

- Open against `main`. Keep PRs focused — one feature/bug per PR.
- Title follows the commit format (`feat(client): ...`). Description should cover *what* and *why*; *how* belongs in the code/comments.
- Include a short test plan (commands you ran, scenarios you covered).
- Make sure `pnpm typecheck`, `pnpm test`, and `pnpm lint` pass locally before requesting review.
- Squash on merge unless the PR has meaningful intermediate commits.

## Rebasing

If you need to rebase, always preserve commit authorship timestamps so blame stays useful:

```bash
git rebase --committer-date-is-author-date <base>
```

When an `edit` stop inside an interactive rebase requires `git commit --amend`, set `GIT_COMMITTER_DATE` explicitly to keep the timestamp aligned with the author date.

## Security-sensitive areas

Take extra care when touching:

- `apps/go/auth` — JWT issuance, password hashing, session/refresh tokens.
- `apps/node/server` — internal-JWT verification, dashboard authorization.
- `apps/node/data-service/src/core/commands/dataset/merge/*` — ingest path that streams untrusted CSV/XLSX through tmp storage.
- `infrastructure/postgres/` — schema migrations are applied via a one-shot k8s job; migrations must be backward-compatible across rolling updates.

Add or extend tests in `e2e/backend` for anything that crosses a service boundary.

## Reporting issues

Open a GitHub issue with:
- Reproduction steps (commands, fixture data if relevant)
- Expected vs actual behavior
- Logs and relevant environment info (OS, Node version, whether running in compose / k3d / real k3s)

For security issues, do not open a public issue — contact the maintainers directly.
