# Repository tooling

## Ownership

- `.prototools` pins runtimes, package managers and standalone CLIs. Custom proto plugins live in `.proto/plugins/` and download official release artifacts
- pnpm owns Node dependencies, workspace links and `pnpm-lock.yaml`. JavaScript tools use the pinned Node LTS runtime through pnpm; direct Node launches use `proto run node` to avoid editor-provided runtimes shadowing the pin. Package manifests have no task scripts
- Moon owns commands, dependencies, file inputs and build outputs. All task shells are Nushell
- Docker Engine and Compose remain operating-system prerequisites. Installing tools does not create a cluster, start containers or deploy resources

Run `proto install` once, then `moon run root:setup`. Put proto's `shims` and `bin` directories before other runtime installations in `PATH`, including runtimes injected by an editor. Verify `node --version` matches `.prototools`.

## Task contract

Read `.agents/skills/moon-tasks/SKILL.md` before changing tasks or manifests. The skill was copied from `metal_processing_marketplace` and adapted to Node LTS, the existing repository layout and formatting rules.

`.moon/tasks/all.yaml` sets Nushell and global toolchain inputs. `node.yaml` owns pnpm inputs, formatting and linting; `typescript.yaml` adds type checking; `css.yaml` adds stylesheet checks; `go.yaml` owns Go quality tasks. Project files define source/test/config groups and project-specific build, runtime and test commands.

| Task | Purpose |
| --- | --- |
| `setup`, `lock` | Install dependencies or refresh the ecosystem lockfile |
| `fmt` | Format using dprint; Prettier handles Node files and gofmt handles Go |
| `lint`, `lint-fix` | Inspect code or apply available lint fixes |
| `lint-css`, `lint-css-fix` | Inspect or fix stylesheets |
| `typecheck` | TypeScript checking or Go vet |
| `check` | Run lint fixes, formatting and type checks |
| `test-unit` | Unit tests without containers |
| `test-int` | Integration tests; most require Docker |
| `test-e2e` | Full-stack container tests |
| `dev`, `build`, `start` | Develop, compile or run compiled output |
| `compose-up`, `compose-down`, `compose-logs` | Explicit container operations |

Source groups exclude tests; tests and fixtures have their own groups. Shared config inputs belong only to the tools that read them. Package source dependencies use `project://` inputs; consumers of `primitive-server/dist` depend on `primitive-server:build`. Client build steps run after the host build because tsup cleans `dist`.

`check` changes files. Review its diff before committing. Tests are separate from `check` and the Git hooks. A task configuration change affects the tests it selects.

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

`hk.pkl` replaces Lefthook. `root:setup` installs hk hooks. Pre-commit runs affected Moon checks, preserving unstaged changes and staging fixes. Commit-msg delegates Conventional Commit validation to Cocogitto (`cog.toml`). Pre-push runs type checks; it does not start Docker.

## Nushell

Repository scripts live in `tools/<purpose>/` and use kebab-case names. `root:lint-nu` parses all `.nu` files without executing their operations. Docker images can invoke Node build executables directly during image construction; host workflow commands remain Moon tasks.
