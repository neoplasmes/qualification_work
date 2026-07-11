## Safe local validation

```bash
moon query projects
moon run :check
moon run :test-unit openresty-discovery:test-int
moon run :build
moon run auth:swagger
```

The discovery integration suite uses an in-memory Kubernetes client and temporary files; it needs no cluster. The Redis cache integration suite uses Testcontainers and is excluded from `microservice-utils:test-unit`. Service unit tests exclude `src/test`, which contains database integration tests. Container suites run through `tools/compose-test/compose-test.nu`, which tears down the stack and preserves the suite's failure status.

Infrastructure and publishing tasks (`root:cluster-*`, `root:migrate`, `root:deploy-to-registry`, `auth:start-swagger`) are explicit operations and must not be included in the default checks.

## Git hooks

`lefthook.yaml` configures Git hooks, and `root:setup` installs them. Pre-commit runs affected Moon checks and stages fixes. Commit-msg delegates Conventional Commit validation to Cocogitto (`cog.toml`). Pre-push runs type checks; it does not start Docker.

## Nushell

Repository scripts live in `tools/<purpose>/` and use kebab-case names. `root:lint-nu` parses all `.nu` files without executing their operations. Docker images can invoke Node build executables directly during image construction; host workflow commands remain Moon tasks.

## General convention

These principles decide every case the rest of the document does not cover.

1. **Role over technology.** Directories are organized by purpose (application,
   library, tool, test, environment), never by language or framework.
2. **One owner per file.** Every file has one owning project or tool and one reason
   to change. A file with an unclear owner is misplaced.
3. **One source of truth.** Each setting and version is defined once and referenced
   elsewhere. Two copies are a defect.
4. **Everything pinned.** Tools, dependencies, base images, and providers have exact
   versions in the repository. Nothing floats to `latest`.
5. **Reproducible from a clean clone.** A fresh clone plus `proto install` and moon
   tasks builds, tests, and runs everything, given the OS prerequisites below.
6. **Explicit dependencies.** Every relationship between projects is declared where
   the build system sees it, never implied by hoisting, relative paths, or command
   order.
7. **Same path locally and in CI.** Developers, agents, and CI run the same tasks.
8. **Create on demand.** No empty directories, placeholder projects, or speculative
   abstractions. No folder contains only an `index.ts`. A shared package appears
   with its second consumer.
9. **Folder boundaries.** Every logical code unit has its own folder and public
   entry point; in TypeScript that is `index.ts`, even for a five-line function.
   Consumers import the folder, never its implementation file. Segment barrels
   export child folders; only a module's own barrel references its implementation
   files. Tool-required entries and generated files keep their required paths.
   Agent hooks use file imports, see [Agent hooks](#agent-hooks).

## Toolchain: proto

- Every tool (runtimes, package managers, build tools, infrastructure CLIs, moon
  itself) is installed by `proto` and pinned in the root `.prototools`.
- Custom proto plugins live in `.proto/plugins/<tool>.toml`, registered once in
  `.prototools` through local `file://` locators (`[plugins.tools]`, or the `plugin`
  field under `[tools.<id>]` to override an inherited locator). Third-party plugin
  definitions are kept in the repository, not loaded from remote URLs; built-in
  plugins stay managed by proto.
- Bun is the only JavaScript runtime, including Vite and Vitest
  (`bun --bun vite`, `bun --bun vitest`). Node.js is not used. pnpm alone installs
  and locks JavaScript dependencies.
- Ecosystem dev libraries (linters, formatters, test runners, type checkers) are
  pinned in their ecosystem's manifest and lockfile. Standalone CLIs (dprint,
  TFLint, Cocogitto) are pinned through proto.
- Forbidden: global tools, system package managers, `curl | sh` installers,
  unpinned on-the-fly packages, and other version managers. Installing proto and
  provisioning WSL on Windows are OS prerequisites outside proto.
- CI images install tools with `proto install` from the same `.prototools`; base
  images use the same versions.

## Operations: moon

Task, file group, input, and inheritance rules follow the moonrepo skill
(`.agents/skills/moonrepo/SKILL.md`). This section records only repository choices.

- Every project in `apps/`, `packages/`, and `e2e/` has a `moon.yaml`. `tools/`
  holds no moon projects; the root project owns their tasks and everything outside
  `apps/` and `packages/`, and never takes the `node` tag.
- Every operation is a moon task: dev servers, quality checks, tests, builds,
  images, deployment, environments. CI, git hooks, documentation, and agents invoke
  moon tasks only; package scripts and shell wrappers are never entry points.
- Every project sets `layer`; `constraints.enforceLayerRelationships` in
  `.moon/workspace.yaml` enforces layer rules.
- Shared tasks live in `.moon/tasks/`: `all.yaml` for every project,
  `<ecosystem>.yaml` by tag (`node.yaml`), `<language>.yaml` by language
  (`typescript.yaml`), `<capability>.yaml` by tag (`css.yaml`).
- Tool-specific root configs (`/dprint.jsonc`, `/biome.json`, `/oxlint.config.ts`,
  `/stylelint.config.js`, `/postcss.config.js`) belong to `cfg-fmt`, `cfg-lint`,
  and `cfg-css` file groups, never to `implicitInputs`.
- TypeScript projects define the file groups `src`, `test-unit`, `test-int`,
  `css`, and `cfg`.

### Shell and Windows execution

- Nushell (`nu`), pinned through proto, is the task and script shell on every OS:
  `taskOptions` in `.moon/tasks/all.yaml` sets `shell: true`, `unixShell: nu`,
  `windowsShell: nu`, and overrides keep it.
- Command wrappers are `.nu` files under their owning project; no Bash,
  PowerShell, batch, or JavaScript wrappers. Git hook scripts use a Nushell
  shebang. Agent hooks are TypeScript run by Bun, see [Agent hooks](#agent-hooks).
- Windows development requires WSL. Docker, Docker Compose, k3d, and other
  Linux-only tools, with their runtime dependencies, run inside WSL; Windows
  installations do not count.
- Every task that invokes such a tool, even indirectly, has a Windows variant
  chosen by `options.os` or an OS branch in a Nu script. It keeps the Linux command
  and adds a `wsl` prefix (`wsl docker compose up`). This is the normal path, not a
  fallback after a native failure.
- Crossing into WSL keeps the working directory, environment, and inputs: convert
  paths and forward variables. Scripts that run entirely in WSL use `wsl nu`.

### Standard task names

Projects use these names where the operation applies, so one command works
everywhere (`moon run :check`). A `moon.yaml` lists tasks in this order: other, code
quality, tests, DX, Docker, local compose.

| Group        | Task                         | Meaning                                                                              | Changes files     |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------ | ----------------- |
| Other        | `setup`                      | Install tools and dependencies.                                                      | No source files   |
| Other        | `lock`                       | Regenerate the lockfile after a dependency change.                                   | Lockfile only     |
| Code quality | `fmt`                        | Formatters only (dprint), after the fix tasks. Never linters.                        | Yes               |
| Code quality | `lint`                       | Regular linters (Oxlint).                                                            | No                |
| Code quality | `lint-fix`                   | Safe fixes from regular linters.                                                     | Yes               |
| Code quality | `lint-css`                   | Style linters (Stylelint).                                                           | No                |
| Code quality | `lint-css-fix`               | Safe fixes from style linters.                                                       | Yes               |
| Code quality | `typecheck`                  | Type checks.                                                                         | No                |
| Code quality | `check`                      | `noop` proxy without inputs: deps on `fmt`, `lint-fix`, `lint-css-fix`, `typecheck`. | Through deps      |
| Tests        | `test-unit`                  | Unit tests: `*.test.<ext>` in `src/` or the project's `tests/`.                      | No                |
| Tests        | `test-int`                   | Integration tests: `*.test.int.<ext>` or `.int/` next to the module.                 | No                |
| Tests        | `test-e2e`                   | End-to-end tests in the project's `e2e/`, outside `src/`.                            | No                |
| DX           | `dev`                        | Run the project locally for development. Persistent.                                 | No                |
| DX           | `build`                      | Produce the project's build output.                                                  | Build output only |
| DX           | `start`                      | Run the built output, where needed.                                                  | No                |
| Docker       | `image`                      | Build the project's container image. Applications only.                              | No                |
| Compose      | `compose-up`, `compose-down` | Start or stop a local compose stack, where needed.                                   | No                |

`check` depends on fix tasks: what can be fixed needs no report, and what cannot
still fails. `lint-fix` and `lint-css-fix` are separate so each caches on its own
inputs. `format`, `format-check`, `lint-styles`, and a bare `test` are not used.
Environment operations (`plan`, `apply`, `deploy`, `promote`, `destroy`) live in
the `env` project. Aggregation uses `moon run :<task>`, not hand-listed projects.

## Code quality

- **Formatting.** dprint is the only formatter, configured in the root
  `dprint.jsonc` with exactly pinned plugins. Its exec plugin runs the root
  pnpm-installed Biome (`biome format`, `biome.json`) with Biome's linter and assist
  disabled. Markdown, TOML (npm packages), and YAML (`plugins.dprint.dev` only) use
  native dprint plugins because Biome does not format them. `.zed/settings.json`
  runs the same chain on save instead of Prettier, without overriding the user's
  language-server choice. `fmt` passes `$projectSource`, the root passes
  `--excludes apps packages`; dprint discovers its config itself.
- **Linting.** Formatting and semantic linting are separate. JS/TS uses Oxlint
  with the root `oxlint.config.ts`; Oxlint, Biome, and the Stylistic JS plugin are
  pinned in the root `package.json`, not through proto. Terraform uses TFLint,
  run by the `env` check task.
- **Frontend tool tasks** run from the workspace root, pass their project
  directory explicitly, declare `repo` as a dependency, and run JavaScript tools as
  `bun --bun <tool>`.
- **CSS.** Plain CSS Modules and PostCSS Preset Env, cascade order
  `reset, tokens, primitives, typography, components`. No Tailwind or Sass; CSS
  Modules `composes` is prohibited. Typography classes from the global
  `typography.css` are attached in JSX. `packages/design-system/src/theme/tokens.css`
  is the hand-maintained token source. The root `postcss.config.js` is shared by
  Vite and Storybook; it runs `postcss-preset-env` against the root Browserslist
  and prepends the layer order from `theme.css` to every stylesheet, so CSS loaded
  before the theme keeps the cascade. Lightning CSS minifies. Feature policy:
  `docs/adr/minor/adr-minor-postcss-preset-env.md`.
- **CSS linting.** Stylelint runs on Bun with the root `stylelint.config.js` and
  the root-owned `stylelint-use-nesting` and `stylelint-order` plugins; there is no
  project-specific plugin. Token rules use regexps built at config load by
  `tools/exctract-tokens-to-stylelint`, which reads `tokens.css` and writes no
  files. Frontend CSS checks depend on the design-system CSS check, so token
  changes invalidate them.

## HTTP API tests

- HTTP API tests are integration tests against a running service. Unit tests of
  domain logic, commands, and queries stay in the language's test framework.
- Single-service tests belong to that application; multi-application scenarios
  belong in `e2e/<suite-name>/`.
- Environments and fixtures are explicit. Local and CI runs share scenarios;
  base URLs and credentials come from outside.

## Directory layout

```text
.proto/
    plugins/
        <tool>.toml          # custom proto plugin definitions
.moon/
    workspace.yaml
    tasks/
        all.yaml             # inherited by every project
        <tag-or-language>.yaml # node.yaml, typescript.yaml, css.yaml
apps/
    <app-name>/              # deployable application, one container image
packages/
    <package-name>/          # library consumed by other projects
tools/
    <tool-name>/             # repository tooling, never deployed, no moon.yaml
e2e/
    <suite-name>/            # tests that exercise several apps together
env/
    local/                   # local stack (compose)
    ...                      # cloud, cluster, delivery; structured by the project
.agents/
    skills/
docs/
    adr/
        major/               # repository-wide technical decisions (MADR)
        minor/               # small local technical decisions (MADR)
AGENTS.md
ARCHITECTURE.repo.md         # this document
ARCHITECTURE.<topic>.md      # project-specific architecture documents
README.md
.prototools
moon.yaml                    # root project: repository-wide and aggregate tasks
.dockerignore
.gitignore
<ecosystem workspace roots>  # manifests and lockfiles, one set per package manager
```

### What goes where

| Directory         | Contains                                                                                                                                                                            | Does not contain                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/`           | Deployable applications, each with its own `Dockerfile`, image, and `layer: application`.                                                                                           | Code imported by other projects.                                         |
| `packages/`       | Libraries imported by apps or other packages. `layer: library`.                                                                                                                     | Deployables, repository tooling.                                         |
| `tools/`          | Tooling run on the repository: shared tool configuration packages, custom checks, generators, git hooks, agent tooling. Not moon projects.                                          | Application runtime code.                                                |
| `e2e/`            | Test suites that start or call more than one app.                                                                                                                                   | Single-project tests; those live in the project.                         |
| `env/`            | Infrastructure as code, cluster bootstrap, deployment charts, delivery and promotion scripts, the local compose stack.                                                              | Application source, package-manager configuration, proto plugins.        |
| `docs/adr/`       | Technical decision records in MADR: `major/ADR.major.<topic>.md`, `minor/ADR.minor.<topic>.md`.                                                                                     | Business and UX decisions.                                               |
| `.proto/plugins/` | Custom proto plugin definitions.                                                                                                                                                    | Tool binaries, caches, local proto state.                                |
| Root              | Tool workspace roots (`.prototools`, `.proto/`, `.moon/`, manifests, lockfiles), repository-wide agent, editor, and CI configuration, architecture documents, the root `moon.yaml`. | Tool configuration that can be a `tools/` package, scripts, source code. |

Shared Oxlint, Biome, dprint, Stylelint, PostCSS, and TypeScript configuration
lives at the root; every TypeScript project extends the root `tsconfig.json`.
Other tool configuration belongs in `tools/` or `env/`.

## Naming

- Repository and backend files and directories use lowercase kebab-case;
  everything in `tools/` does, without exception. Frontend source, including
  `packages/design-system`, follows the rules below instead.
- Frontend files and folders that are not React components use lower camelCase:
  hooks, controllers, services, entities, commands, queries, utilities, domain
  groups, model modules (`pageData/pageData.ts`, `useRead/useRead.ts`), and the
  `ui`, `model`, `lib` segments.
- Folders whose primary purpose is a React component, widget roots included, and
  component files use PascalCase (`RepeatedPageComponent/RepeatedPageComponent.tsx`);
  their CSS modules use lower camelCase (`repeatedPageComponent.module.css`).
  Widgets are reused on more than one distinct page and live at
  `widgets/WidgetName/WidgetName.widget.tsx` with `widgetName.widget.module.css`.
  Pages own `<PageName>.page.tsx`, `<pageName>.page.module.css`, populated
  segments, and `index.ts` at the slice root
  (`executor/catalog/ExecutorCatalog.page.tsx`); see
  [the page slice contract](ARCHITECTURE.frontend.md#page-slices).
- Page and widget child components are extracted only for repeated use within the
  owner or to split a file over 300 lines, with recursive `ui`, `model`, `lib`
  segments and `index.ts`; see
  [the widget contract](ARCHITECTURE.frontend.md#widget-slices-and-recursive-components).
- Dots separate extensions and semantic suffixes: `oxlint.config.ts`,
  `button.module.css`, `Button.stories.tsx`, `route-tree.gen.ts`, `iconModules.d.ts`.
- Tool-required names stay: `AGENTS.md`, `CLAUDE.md`, `README.md`, `README.txt`,
  `ARCHITECTURE.md`, `ARCHITECTURE.<topic>.md`, `Dockerfile`, TanStack Router's
  `__root.tsx`, route filenames, configured router entries, generated files, and
  dotfiles.
- `node_modules` and everything inside dot-prefixed directories are never renamed.
  Ordinary files in `refs/` are not exempt.
- ADR files are `ADR.major.<topic>.md` or `ADR.minor.<topic>.md`. Dots separate
  fields, kebab-case joins words within a field. Code identifiers follow their
  language.
- A project's directory name is its moon id; a different id is set with `id` in
  `moon.yaml` (`e2e/browser` with `id: e2e-browser`).
- Paths never contain language or framework names: `apps/billing`, not
  `apps/go-billing`.
- Project names describe the domain or job; no `common`, `shared`, `utils`,
  `helpers`, or `misc`. Internal module and package names follow the language.
- Top-level names `apps`, `packages`, `tools`, `e2e`, `env`, `docs`, `.proto` are
  reserved. New top-level directories require a change to this document.

## Package-manager workspaces

- Each ecosystem has one workspace root at the repository root with one committed
  lockfile. CI installs in frozen mode.
- Workspace members are listed explicitly, not globbed, because `apps/`,
  `packages/`, and `tools/` mix languages. After adding one, `moon query projects`
  must show it with the expected language and layer.
- Each project declares its own application dependencies. Root-owned tooling
  (Oxlint, Biome, Stylistic) is resolved from the root by tasks run there.
- Shared tool configuration is a `tools/` package projects depend on, except the
  root-owned Oxlint, Biome, dprint, Stylelint, PostCSS, and TypeScript configs.
  Projects never reach configuration through `../../`.
- Tooling that must not affect application dependencies may keep its own
  workspace root and lockfile in its `tools/` project, stated in its `AGENTS.md`.

## Containers: Docker

- Every application has its own `Dockerfile` and image; packages, tools, and tests
  have none.
- The build context is the repository root; the `image` task names the Dockerfile.
- Dockerfiles are multi-stage, cache dependency downloads, copy only needed
  manifests, lockfile, and members, and ship only runtime artifacts.
- Base images are pinned to versions matching `.prototools`.
- Processes run unprivileged; every image has a health endpoint or command.
- The root `.dockerignore` excludes secrets, local state, caches, dependencies,
  and build output.
- Images are tagged by commit and deployed by digest. The tested image is promoted
  between environments, never rebuilt.
- Runtime configuration comes from environment variables and mounted files, never
  baked in. Build-time settings that bind an image to one environment are
  documented.
- The local stack lives in `env/local/compose.yaml`, started by a moon task.

## Agents

- The root `AGENTS.md` is every agent's entry point: communication and working
  rules plus links to architecture documents. `CLAUDE.md` and similar files only
  point to it. A project `AGENTS.md` adds local rules; agents read the root, then
  the nearest one. Language-wide rules go in the root `AGENTS.md` or a skill.
- Skills live in `.agents/skills/<skill-name>/SKILL.md`; runner configuration
  (`.codex/`, `.claude/`) stays at the root.
- Agents run operations through moon tasks, like CI. Agent tooling (MCP servers,
  browser automation, helpers) lives in `tools/` with pinned dependencies and root
  moon tasks.
- MCP servers are launched with `proto run` directly, never through moon, so only
  JSON-RPC reaches stdout. Claude Code uses the root `.mcp.json`, Codex uses
  `.codex/config.toml`.
  - **moon MCP**: `proto run moon -- mcp` with proto logging limited to errors;
    gives the project graph, tasks, templates, and changed files.
  - **Codebase Memory MCP**: pinned in `.prototools` through
    `.proto/plugins/codebase-memory-mcp.toml` with SHA-256 verification. Root
    tasks `codebase-memory-setup`, `codebase-memory-index`
    (`tools/codebase-memory-mcp/codebase-memory-mcp.nu`), `codebase-memory-serve`.
    Indexes stay in the per-user cache; `.cbmignore` excludes vendored skills and
    design references.
- Cloud sessions get tools from the environment setup script: it installs the
  pinned proto, runs `proto install` for Bun, moon, Nushell, dprint, hk, Cocogitto,
  and Codebase Memory MCP, links proto binaries and shims into `/usr/local/bin`,
  and installs dependencies with the image's pnpm. Because `ghcr.io` is blocked,
  `PROTO_PLUGINS_USE_URL_DIST=1` loads built-in plugins from GitHub; the network
  allows `registry.npmjs.org` and `plugins.dprint.dev`.
- Agents never write secrets, credentials, state, or personal data into the
  repository, logs, or commits.
- Parallel writers use separate worktrees or disjoint files; lockfiles and shared
  config have one owner per task. Review agents report, never edit or commit.

### Agent hooks

All agent hooks enter `tools/agent-hooks/gateway.ts`. Provider adapters translate
native payloads; domains consume canonical events.

```text
agent-hooks/
├── gateway.ts                  # single entry point for all agent hooks
│
├── lib/
│   ├── agent.ts                # Agent base class: native payload <-> HookEvent
│   ├── hook.ts                 # HookEvent, HookDecision, HookRouter, block()
│   ├── command.ts              # captured external commands and bounded output
│   └── json.ts                 # runtime guards for untrusted JSON
│
├── agents/                     # Agent subclasses, one per provider
│   ├── claude.ts
│   ├── codex.ts                # extends ClaudeAgent
│   └── cursor.ts
│
└── domains/
    ├── moon/
    │   ├── router.ts           # selects events handled by Moon
    │   ├── lib/
    │   │   └── ...
    │   └── hooks/
    │       ├── require-skill.on-edit.ts
    │       ├── validate-config.on-edited.ts
    │       ├── check-workspace.on-stop.ts
    │       ├── what-it-does-2.on-edit.ts
    │       └── what-it-does.other-canonical-event.ts
    └── other-domain/
        ├── router.ts
        ├── lib/
        │   └── ...
        └── hooks/
            ├── what-it-does.on-edit.ts
            └── what-it-does.on-stop.ts
```

```text
Agent hook
Claude / Codex / Cursor
        │
        │ stdin JSON
        ▼
┌────────────────────┐
│     gateway.ts     │
│                    │
│ single entrypoint  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ agent.parse()      │
│                    │
│ native event/tool  │
│        ↓           │
│ canonical event    │
└─────────┬──────────┘
          │
          │ HookEvent
          │
          │ {
          │   event: "on-edited"
          │   tool: "edit"
          │   files: [...]
          │   cwd, root
          │   sessionId
          │   stopHookActive
          │ }
          │
          ▼
┌────────────────────┐
│ gateway routers    │
└─────────┬──────────┘
          │
          ├────────────────────────────────────┬────────────────────────────────────┐
          │                                    │                                    │
          ▼                                    ▼                                    ▼
┌───────────────────────────┐        ┌───────────────────────────┐        ┌───────────────────────────┐
│        moon router        │        │        lint router        │        │     telemetry router      │
└─────────┬─────────────────┘        └─────────┬─────────────────┘        └─────────┬─────────────────┘
          │                                    │                                    │
          ▼                                    ▼                                    ▼
hooks/                               hooks/                               hooks/
│                                    │                                    │
├ require-skill.on-edit.ts           ├ lint-files.on-edited.ts            └ report.on-stop.ts
├ validate-config.on-edited.ts       └ lint-workspace.on-stop.ts
└ check-workspace.on-stop.ts
```

The tree shows the convention: `other-domain`, lint, telemetry, and ellipses are
extension points, not required directories. Currently implemented: the Moon
domain, three provider adapters, and integration tests (`repo:typecheck` through
`tools/tsconfig.json`, `repo:test-int` through `tools/vitest.config.ts`).

1. `gateway.ts` is the only entry point. It owns the provider and router
   registries, reads stdin once, lets the agent parse it, calls routers in order,
   stops on the first blocking decision, and writes one provider response. The
   provider is passed as a CLI argument because Claude and Codex payloads are too
   similar to tell apart.
2. `agents/<agent>.ts` extends `Agent`: it declares native event and tool tables,
   overrides only differing field readers (`files`, `cwd`, `sessionId`,
   `stopHookActive`), and implements `respond`, since output contracts differ too
   (Cursor). Provider details never reach domains.
3. `Agent.parse` produces a `HookEvent` (`event`, `tool`, `files`, `cwd`, `root`,
   `sessionId`, `stopHookActive`; files deduplicated, workspace-relative, `/`).
   Unknown providers, unsupported events, malformed payloads, and directories
   outside Git produce no work. External JSON is checked at runtime.
4. `domains/<domain>/router.ts` filters events and inputs, then calls hooks named
   `<what-it-does>.<canonical-event>.ts` in explicit order, stopping on the first
   block. A new domain is one more entry in the gateway's `routers` list.
5. A hook gets prepared arguments and returns a decision or nothing; it never
   touches stdin or provider JSON. Helpers stay private until several consumers
   need them: then the domain `lib/`, or the root `lib/` if domain-independent.
   Hook modules use explicit file imports, an exception to the folder-barrel rule.
6. The design is language-independent; prefer a language with real modules over
   shell. Here it is TypeScript on Bun with ES modules.

| Provider    | Native events                       | Tool matcher for edit events | Command                                              |
| ----------- | ----------------------------------- | ---------------------------- | ---------------------------------------------------- |
| Claude Code | `PreToolUse`, `PostToolUse`, `Stop` | `Edit\|MultiEdit\|Write`     | `bun run <repo>/tools/agent-hooks/gateway.ts claude` |
| Codex       | `PreToolUse`, `PostToolUse`, `Stop` | `^apply_patch$`              | `bun run <repo>/tools/agent-hooks/gateway.ts codex`  |

`PreToolUse`, `PostToolUse`, `Stop`, and `SessionStart` map to `on-edit`,
`on-edited`, `on-stop`, and `on-start` (Cursor: the camelCase equivalents, command
argument `cursor`, adapter only, not registered). Configuration lives in
`.claude/settings.json` and `.codex/hooks.json`; Codex requires trusting project
hooks (`/hooks`). Provider contracts: [Codex hooks](https://learn.chatgpt.com/docs/hooks),
[Cursor hooks](https://cursor.com/docs/hooks).

The Moon domain: `require-skill.on-edit.ts` reminds the agent to read the moon
skill before the first config edit per session (marker in `.local/agent-hooks/`,
recording the reminder, not proof of reading); `validate-config.on-edited.ts`
runs `moon query tasks` on edited configs; `check-workspace.on-stop.ts` runs
`moon run :check` for changed trees. Recursive stops and missing moon are skipped.
Shell edits bypass edit routing, and post-edit decisions cannot undo edits.

## Git and commits

- Git hooks are owned by hk (pinned in `.prototools`) and declared in the root
  `hk.pkl`; steps run through `nu --no-config-file -c`. `moon run repo:setup`
  installs them through `repo:install-hooks`. moon's `vcs.hooks` are not used
  because they do not restage files changed by fixes.
- `pre-commit` stashes unstaged changes, runs
  `moon run :fmt :typecheck --affected --status staged`, and restages fixed files.
  `check` has no inputs and is never affected, so `fmt` (which pulls in the fix
  tasks) plus `typecheck` stands in for it.
- `lint` and `lint-css` do not use `options.affectedFiles`: either way the whole
  project or workspace is linted.
- Commits follow Conventional Commits. `commit-msg` runs
  `cog --quiet verify --file <message file>` directly, since it reads no project
  files; history uses `cog check`.
- Hooks checking project files call moon tasks, never hardcoded paths.
- One commit is one coherent, verified change; moving projects and changing their
  content are separate commits.

## Secrets and local state

- Secrets live in `.secrets/`, caches in `.cache/`, run output in `.local/`; all
  are git-ignored and excluded from build contexts.
- Only placeholder templates named `*.example` are versioned.
- Infrastructure state lives outside disposable compute and is a secret.

## Adding a project

1. Create `apps/<name>`, `packages/<name>`, `tools/<name>`, or `e2e/<name>` by role.
2. Add `moon.yaml` with `language`, `layer`, `tags`, `dependsOn`, the standard file
   groups, and only tasks `.moon/tasks/` does not provide. `tools/` gets none.
3. Add it to the package manager's member list and run `lock`.
4. For an application, add its `Dockerfile`, `image` task, and compose service.
5. Add a project `AGENTS.md` only for rules beyond the root ones.
6. Verify with `moon query projects` and `moon run <name>:check <name>:test-unit`.

## Changing this document

Changes to layout, naming, toolchain rules, or workspace roots update this document
in the same commit. Moving a project updates every reference to its path:
Dockerfiles, compose, delivery scripts, agent configuration, and documentation.
