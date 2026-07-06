---
name: moon-tasks
description: Rules for moon tasks, file groups, file patterns, templates and package manifests in this repository. Use before creating or editing any moon.yaml, .moon/ file or package.json, when adding a project, a task, a tool, a script or a new language, when writing glob patterns for inputs, or when you are about to create the same file structure again.
---

# Moon tasks and file groups

## Local adaptation

Copied from `metal_processing_marketplace`. In this repository, Node LTS replaces Bun: execute JavaScript tools with `pnpm exec`, and applications with `node` or `pnpm exec tsx`. Keep the existing Prettier rules through dprint exec, and format Go through `proto run go --exe gofmt`. Node tasks run from their project directories so `pnpm exec` resolves each package's own executables and local tool configuration. Retain the existing `apps/node`, `apps/go`, `packages/node`, `packages/go` layout and the root project ID `root`. Examples in references use the upstream names and tools; apply these substitutions. Agent gateway hooks described at the end are upstream context and are not installed here. Docker and deployment tasks are opt-in. Existing integration test paths may stay unchanged when tasks explicitly separate them from unit tests.


Every operation in this repository is a moon task. Tools are called directly from the task; `package.json` never contains `scripts`.

This file holds the rules. The references hold verified examples:

| Reference                                            | Read it when                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [patterns.md](references/patterns.md)                | You write or review a file group, an input or an output.                              |
| [decomposition.md](references/decomposition.md)      | You decide where a task lives, split a task, or wire deps between tasks and projects. |
| [polyglot.md](references/polyglot.md)                | A project is not TypeScript: Go, Rust, Terraform, Hurl, Python, Nushell.              |
| [migration.md](references/migration.md)              | You port a moon config from another repository (for example `qualification_work`).   |
| [templates.md](references/templates.md)              | You notice a repeated structure, or you write or run a `moon generate` template.      |

## Workflow

1. Read the project's `moon.yaml` and every `.moon/tasks/*.yaml` it inherits (`moon project <id>` lists them).
2. Decide where the change belongs: the most general layer that every inheritor needs (see [Decomposition](#decomposition)).
3. Write file groups first, then tasks that reference them. Never write a task with inline catch-all inputs.
4. Name tasks with the vocabulary below. A new name follows [Naming new tasks](#naming-new-tasks).
5. Verify with the steps in [Verify before finishing](#verify-before-finishing).

## Task names

Declare a task only when the project needs it. Keep this order in every `moon.yaml` and in documentation.

Other: `setup` (install tools and dependencies), `lock` (refresh the lockfile), project-specific helpers such as `browser`.

Code quality:

| Task           | Runs                                                              | Changes files |
| -------------- | ----------------------------------------------------------------- | ------------- |
| `fmt`          | Formatters only (dprint). Never linters.                          | Yes           |
| `lint`         | Regular linters (oxlint).                                         | No            |
| `lint-fix`     | Fixes from regular linters (`oxlint --fix`).                      | Yes           |
| `lint-css`     | Style linters (stylelint).                                        | No            |
| `lint-css-fix` | Fixes from style linters (`stylelint --fix`).                     | Yes           |
| `typecheck`    | Type checks.                                                      | No            |
| `check`        | Proxy: `noop`, `inputs: []`, deps on `fmt`, `*-fix`, `typecheck`. | Through deps  |

`check` depends on the `*-fix` tasks: what was fixed automatically is not worth reporting, what could not be fixed still fails the task. `lint-fix` and `lint-css-fix` stay separate so each is cached on its own inputs. `fmt` depends on the fix tasks, so fixes land before formatting.

Tests:

| Task        | Runs              | Where the tests live                                                        |
| ----------- | ----------------- | --------------------------------------------------------------------------- |
| `test-unit` | Unit tests        | `*.test.<ext>` next to the code in `src/`, or the project's `tests/` folder |
| `test-int`  | Integration tests | `*.test.int.<ext>` files or a `.int/` folder next to the tested module      |
| `test-e2e`  | End-to-end tests  | the project's `e2e/` folder outside `src/`; multi-app suites in root `e2e/` |

A language that fixes its own test file names keeps them and maps them onto these tasks (Go `*_test.go`, Rust `tests/`); see [polyglot.md](references/polyglot.md).

DX: `dev` (persistent, not cached), `build` (declares `outputs`), `start` (runs the built output, `deps: ~:build`, only where needed).

Docker: `image` (applications only). Local compose, only when needed: `compose-up`, `compose-down`. Moon's own Docker integration (`moon docker`, the `docker` setting in `moon.yaml` and `.moon/workspace.yaml`) is not used.

Forbidden names: `format`, `format-check`, `lint-styles`, `lint-styles-fix`, `test` without a suffix, any `*-check` duplicate of `check`. The Moon router sends canonical `on-edited` configuration events to its validation hook, which rejects them.

### Naming new tasks

- kebab-case, verb first: `lint`, `build`, `compose-up`.
- A narrower variant adds a scope after the verb: `lint-css`, `test-int`. A fixing variant adds `-fix` at the end: `lint-css-fix`.
- Name the operation, never the tool or the language: `lint`, not `oxlint` or `golangci`; `fmt`, not `dprint`; `lock`, not `tidy`.
- The same operation has the same name in every project and every language, so `moon run :<task>` works across the workspace.
- A step of a bigger task is `<task>-<part>` (`build-client`, `build-server`) and is `internal: true` when nobody runs it alone.

## Where things are declared

- `.moon/tasks/all.yaml`: inherited by every project. `implicitInputs` that affect everything (`/.prototools`) and the Nushell task shell.
- `.moon/tasks/node.yaml` (`inheritedBy.tags: node`): pnpm ecosystem `implicitInputs` (root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`), shared groups `cfg-fmt` and `cfg-lint`, tasks `fmt`, `lint`, `lint-fix`, `check`.
- `.moon/tasks/typescript.yaml` (`inheritedBy.languages: typescript`): `typecheck` and its `check` dependency.
- `.moon/tasks/css.yaml` (`inheritedBy.tags: css`): group `cfg-css`, tasks `lint-css`, `lint-css-fix`, their `fmt` and `check` dependencies.
- A new ecosystem gets its own `.moon/tasks/<ecosystem>.yaml` with the same task names; see [polyglot.md](references/polyglot.md).
- A tool-specific root config (`/biome.json`, `/oxlint.config.ts`, `/stylelint.config.js`) goes into a `cfg-*` group used only by the tasks of that tool, never into `implicitInputs`. Otherwise editing it would invalidate unrelated caches.
- A project `moon.yaml` holds `language`, `layer`, `tags`, `dependsOn`, its own file groups and only the tasks or overrides the shared files do not cover. `deps` and inherited lists merge, so an override lists only what it adds.
- Inside `.moon/tasks/*.yaml` write deps as `~:task` (this project). Inside a project `moon.yaml` write `project:task` explicitly.
- `tools/` has no `moon.yaml`. The root project lints and formats it. Everything inside `tools/` uses kebab-case names.
- The root `moon.yaml` owns repository tooling and configuration outside `apps/`, `packages/` and the dedicated `e2e/` projects. It never gets the `node` tag.

## Decomposition

Put each piece of configuration on exactly one layer, the most general one where it is true for every inheritor:

| Layer                                | Selected by                    | Holds                                                                |
| ------------------------------------ | ------------------------------ | -------------------------------------------------------------------- |
| `.moon/tasks/all.yaml`               | every project                  | inputs and options true for any language                             |
| `.moon/tasks/<ecosystem>.yaml`       | `inheritedBy.tags` (`node`)    | package-manager manifests and lockfile, shared quality tasks         |
| `.moon/tasks/<language>.yaml`        | `inheritedBy.languages`        | compiler or type checker tasks                                       |
| `.moon/tasks/<capability>.yaml`      | `inheritedBy.tags` (`css`)     | tasks of an optional capability and their `check` and `fmt` wiring   |
| project `moon.yaml`                  | the project itself             | file groups, `dependsOn`, project tasks, additions to inherited ones |

Rules that follow from it:

- A project overrides an inherited task only to add something (a dep, an input). Lists merge with `append`; use `options.merge*` only when appending is wrong, and say why in the commit.
- A fix task differs from its check by one flag. Share inputs with a YAML anchor, or declare it with `extends: <check>` plus `args: --fix` when the flag can go last.
- `deps` express order and invalidation between tasks. `inputs` express which files make a task's cache stale. Never add a dep only to get a file into the hash, and never add a file input only to get ordering.
- A task depends on another project's build output through `deps: [<project>:build]`; on another project's source files through a `project://<id>?group=<group>` input. Both projects are linked with `dependsOn`.

Details and verified examples: [decomposition.md](references/decomposition.md).

## File groups

Every TypeScript project defines:

- `src`: source code only, tests, stories and generated files excluded;
- `test-unit`, `test-int`: test files of each kind (defaults are empty in `node.yaml`);
- `css`: stylesheets for `lint-css`;
- `cfg`: local configs of the project only. Root configs never go here.

Add other groups (`assets`, `stories`, `gen`, `migrations`) when a task needs them. A task referencing a group that the project does not define fails with `unknown_file_group`, so shared files declare empty defaults.

Write precise patterns: explicit extensions, suffixes and exclusions. Never use `**/*` or a list of every JavaScript extension. Every file belongs to the group that describes its role, and a file that is not an input of any task is fine: it simply never invalidates a cache.

## Pattern syntax

moon uses Rust globs (the wax library), not JavaScript globs and not regular expressions. Separators are always `/`, even on Windows. Patterns never start with `./` or `..`.

| Pattern       | Meaning                                                  |
| ------------- | -------------------------------------------------------- |
| `*`           | Zero or more characters except `/`, eager                |
| `$`           | Like `*`, lazy                                           |
| `**`          | Zero or more directory levels                            |
| `?`           | Exactly one character except `/`                         |
| `[abc]`       | One character from the class, case sensitive             |
| `[!xyz]`      | One character not in the class                           |
| `[a-z]`       | One character from the range                             |
| `[!x-z]`      | One character outside the range                          |
| `{glob,glob}` | Any of the alternatives                                  |
| `<glob:n,m>`  | The sub-glob repeated from n to m times                  |
| `!` prefix    | Excludes files matched by the previous positive patterns |

Paths without a leading `/` are relative to the project root (`src/**/*.ts`, `package.json`). Paths with a leading `/` are relative to the workspace root (`/package.json`).

Pitfalls found in this repository:

- An empty alternative such as `{,.int}` does not parse. Write `*.{test,test.int}.{ts,tsx}`.
- An alternative must not contain `/`: `{src/**/*.ts,server/*.ts}` fails with `glob::create`. Write one line per root, or put only folder names in the braces: `{src,server}/**/*.ts`.
- Bash extglob such as `!(*.module).css` does not exist. Exclude with a separate `!` line.
- A level is not optional without `**`: `src/*.test.ts` matches only direct children of `src/`.
- Files ignored by `.gitignore` are never inputs, even when a glob matches them. Generated files that must invalidate a task are committed or reached through the producing task's `outputs`.
- `@globs(group)` passes only glob patterns and drops literal paths; `@files(group)` passes the matched files. Use `@files` when the group holds literal paths.
- Commands run through Nushell, which expands an unquoted `*` in arguments into file names. Quote literal globs and regexes: `cargo test --test '*'`, `go test -run '^TestInt'`.
- A pattern with `?` cannot be written in the `glob://` or `file://` URI form, because `?` starts the query. Use the plain or object form.

The full cookbook with verified patterns (repetition `<[0-9]:14>`, several roots, role-based groups) is in [patterns.md](references/patterns.md).

Inside a command, `@globs(group)` and `@files(group)` expand a group into arguments, so a tool receives exactly the files the task hashes. Prefer `@files`: moon applies the `!` exclusions itself and the tool gets a plain file list. `@globs` hands raw patterns to Nushell first, which expands some of them (`src/**/*.css`), leaves others as they are (`**/*.{tf,tfvars}`, `!src/**/*.module.css`), so the tool must understand glob and negation syntax. Use `@globs` only for tools that take patterns, and when a file list could exceed the Windows command line limit (about 32 000 characters).

## Commands

- JavaScript tools run on pinned Node LTS: `pnpm exec oxlint ...`, `pnpm exec stylelint ...`, `pnpm exec tsc ...`, `pnpm exec vite ...`. Applications run through `node` or `pnpm exec tsx`. Dependencies change through pnpm and `moon run root:lock`.
- Every other tool is pinned in `.prototools` and called by its name. No global installs, no `toolchain` other than the default.
- Tasks run from the workspace root (`taskOptions.runFromWorkspaceRoot: true`) and pass `$projectSource`. Tools that must run inside the project (`vite`, `storybook`, `go`) set `options.runFromWorkspaceRoot: false`.
- dprint finds `dprint.jsonc` by itself. Pass `@files(...)` from the task input groups so the formatted files and hashed files match. The exec plugin uses the pnpm-installed Prettier and proto-installed gofmt.
- A command never climbs out of the project with `../`. Use a workspace-relative input (`/file`) and `$workspaceRoot` in the command.
- Multi-step command logic is a Nushell script in `tools/<tool-name>/` called from the task, or several tasks wired with `deps`. Agent hooks follow the TypeScript/Bun contract in `ARCHITECTURE.repo.md#agent-hooks`. Never a Bash `script:`; the task shell is Nushell.
- Only `dev`, `start`, `compose-*`, `setup`, `lock` and helpers like `browser` use `cache: false`. Interactive helpers use `preset: utility`, long-running servers `preset: server`. Every other task declares `inputs`.
- YAML anchors (`&lint-inputs` and `*lint-inputs`) share an identical input list between a check and its fix.

## Polyglot projects

The task vocabulary does not change with the language. Each ecosystem maps its tools onto the same names:

| Task        | TypeScript                   | Go                              | Rust                     | Terraform              |
| ----------- | ---------------------------- | ------------------------------- | ------------------------ | ---------------------- |
| `fmt`       | dprint (Biome)               | dprint (gofmt)                  | dprint (rustfmt)         | dprint (terraform fmt) |
| `lint`      | oxlint                       | golangci-lint                   | cargo clippy             | tflint                 |
| `typecheck` | tsc                          | go vet                          | cargo check              |                        |
| `test-unit` | vitest                       | go test                         | cargo test --lib         |                        |
| `test-int`  | vitest, hurl                 | go test -tags integration, hurl | cargo test --test '*'    |                        |
| `lock`      | pnpm install --lockfile-only | go mod tidy                     | cargo update --workspace |                        |

dprint stays the single formatter: a new language gets a dprint plugin (or the exec plugin around its formatter), not a separate `fmt` command. Full configs: [polyglot.md](references/polyglot.md).

## Templates

When you are about to create a structure that already exists at least twice in the repository (a page slice, a widget, a package, an ADR, a command and its query), or you create the second copy yourself, stop and propose to the user to capture it as a `moon generate` template. Show the repeated paths, the variables the template would take and the destination. Create the template only after the user agrees. When a template exists, generate with it instead of copying files by hand. Mechanics and rules: [templates.md](references/templates.md).

## Verify before finishing

1. `moon query projects` lists the expected projects.
2. `moon task <project>:<task> --json` for every task you touched; read `inputGlobs`, `inputFiles` and `deps` and confirm they match the intent.
3. For a new or changed group, list what it matches: a throwaway task `command: echo @files(<group>)` with `cache: false`, run once, then removed.
4. Run `moon run :check` and affected tests that do not need Docker. Run container suites only when explicitly requested. Task configuration changes affect the corresponding tests.
5. Update `ARCHITECTURE.repo.md` in the same change when a rule here changes.

Agent configuration calls only `bun run tools/agent-hooks/gateway.ts <provider>`,
never individual domain hooks. Follow the directory tree and routing contract in
`ARCHITECTURE.repo.md#agent-hooks` when changing hooks:

- Provider adapters subclass `lib/agent.ts`: they map native event and tool names
  to a canonical `HookEvent` and encode responses. The gateway calls the domain
  routers, including `domains/moon/router.ts`.
- The Moon router selects canonical edit events for `moon.yaml`, `.moon/`, and
  `package.json`, skipping unrelated files and non-edit tools.
- `domains/moon/hooks/require-skill.on-edit.ts` denies the first configuration edit per
  session and points here; its marker records the reminder, not proof of reading.
- `domains/moon/hooks/validate-config.on-edited.ts` checks `moon query tasks`, forbidden names,
  catch-all cached inputs, and `scripts` in edited package manifests.
- `domains/moon/hooks/check-workspace.on-stop.ts` runs `moon run :check`; the router skips
  recursive stops and clean working trees.

Agent hooks are TypeScript modules running on Bun. `repo:typecheck` checks
`tools/` through `tools/tsconfig.json` and is part of `repo:check`.
The gateway alone reads stdin and emits provider-protocol JSON. Hooks receive
canonical arguments and return decision records. Extract reused helpers into
`domains/moon/lib/`; shared infrastructure lives in `agent-hooks/lib/`.
The complete folder and event-flow diagrams are in `ARCHITECTURE.repo.md#agent-hooks`
and `docs/adr/major/ADR.major.agent-hook-gateways.md`. Shell edits bypass edit hooks;
the stop check does not enforce every Moon configuration convention.
