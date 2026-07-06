# Task decomposition

How to split configuration between layers, between tasks, and between projects. Examples were checked on moon 2.5.6 (`moon task <target> --json`).

## 1. One fact, one layer

Ask for each line you are about to write: "for which projects is this true?"

| True for                                   | Goes to                                        | Example                                   |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------- |
| every project                              | `.moon/tasks/all.yaml`                         | `/.prototools` input, Nushell shell       |
| every project of a package manager         | `.moon/tasks/<ecosystem>.yaml` by tag          | `/pnpm-lock.yaml`, `fmt`, `lint`          |
| every project of a language                | `.moon/tasks/<language>.yaml` by language      | `typecheck` with `tsc`                    |
| projects that opted into a capability      | `.moon/tasks/<capability>.yaml` by tag         | `lint-css` for tag `css`                  |
| one project                                | its `moon.yaml`                                | `build` with Vite, file groups            |
| one root config used by one tool           | a `cfg-<tool>` group next to that tool's tasks | `cfg-css: [/stylelint.config.js]`         |

`inheritedBy` conditions combine with AND. `tags` and `toolchains` accept `and`, `or` and `not` clauses; `files` (no globs) selects projects containing a file:

```yaml
inheritedBy:
    languages: typescript
    tags:
        not:
            - e2e
```

The root project inherits `all.yaml` too. That is why `fmt` and `check` live in the ecosystem files and not in `all.yaml`: the root defines its own `fmt` and `check`, and an inherited copy would merge into them.

## 2. Check, fix and the `check` proxy

A read-only task and its fixing twin differ by one flag. Two ways to share the rest:

```yaml
tasks:
    lint:
        command:
            bun --bun oxlint --config oxlint.config.ts --disable-nested-config
            --no-error-on-unmatched-pattern $projectSource
        inputs: &lint-inputs
            - "@group(src)"
            - "@group(cfg-lint)"

    lint-fix:
        command:
            bun --bun oxlint --config oxlint.config.ts --disable-nested-config
            --no-error-on-unmatched-pattern --fix $projectSource
        inputs: *lint-inputs
```

```yaml
tasks:
    lint-fix:
        extends: lint
        args: --fix
```

`extends` copies command, inputs, deps and options of the sibling (also an inherited sibling inside `.moon/tasks/*.yaml`) and appends `args`. Use it when the fix flag may go last; otherwise keep the anchor form.

`check` never runs anything itself:

```yaml
tasks:
    check:
        command: noop
        inputs: []
        deps:
            - ~:fmt
            - ~:lint-fix
```

Each capability file adds itself to it (`css.yaml` adds `~:lint-css-fix` to `check` and to `fmt`), so a project gets exactly the checks its tags and language select.

## 3. Splitting a task into steps

When one operation has independent parts, keep the public name and hide the parts:

```yaml
tasks:
    build-client:
        command: bun --bun vite build
        inputs:
            - "@group(src)"
            - "@group(css)"
            - "@group(cfg)"
        outputs:
            - dist/client
        options:
            internal: true
            runFromWorkspaceRoot: false

    build-server:
        command: bun --bun vite build --ssr src/entry.server.tsx --outDir dist/server
        inputs:
            - "@group(src)"
            - "@group(cfg)"
        outputs:
            - dist/server
        options:
            internal: true
            runFromWorkspaceRoot: false

    build:
        command: noop
        inputs: []
        deps:
            - frontend:build-client
            - frontend:build-server
```

Each step is cached on its own inputs, both run in parallel, and people keep running `moon run frontend:build`. An `internal` task cannot be run from the command line, only depended on.

## 4. Deps versus inputs

| You need                                                      | Use                                                                  |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Task B must run after task A                                  | `deps: [a-project:a]`                                                |
| B consumes A's build output                                   | `deps` with `cacheStrategy: outputs` (B reruns only when A's output changes) |
| B reads another project's sources directly (no build step)    | input `project://<id>?group=<group>`, plus `dependsOn: [<id>]`       |
| B and C must not run at the same time (shared DB, port, file) | `options.mutex: <resource-name>` on both                             |
| B is ordering only, its changes must not invalidate A         | default for deps without outputs (`cacheStrategy: ignored`)          |

```yaml
tasks:
    build:
        deps:
            - target: design-system:build
              cacheStrategy: outputs
```

A dependency without outputs (a check, a test) never invalidates the dependent task by default; a dependency with outputs (a build) does.

## 5. Overriding inherited tasks

- Add to an inherited task by redeclaring only the addition. Lists merge with `append`:

```yaml
tasks:
    lint-css:
        deps:
            - design-system:lint-css
```

- Change a list completely with `options.mergeInputs: replace` (also `mergeArgs`, `mergeDeps`, `mergeEnv`, `mergeOutputs`). Explain the reason in the commit message.
- Drop or rename inherited tasks per project:

```yaml
workspace:
    inheritedTasks:
        exclude:
            - typecheck
        rename:
            build: build-docs
```

Excluding is a smell: usually the project has the wrong tag. Fix the tag first.

## 6. Options worth knowing

| Option / field                     | Use it for                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `preset: server`                   | `dev`, `start`: no cache, streamed output, persistent, not in CI           |
| `preset: utility`                  | interactive helpers: no cache, interactive, streamed, skipped in CI        |
| `options.internal: true`           | steps that only exist to be depended on                                    |
| `options.os: windows` / `linux`    | OS-specific variants of one operation                                      |
| `options.envFile: .env`            | loading a dotenv file without a wrapper script                             |
| `options.affectedFiles: args`      | passing only changed files under `--affected`; outside it moon appends `.`, so not for tasks that pass `$projectSource` from the workspace root |
| `options.timeout`, `retryCount`    | bounding hung or network-bound tasks                                       |
| `checks` (`requirement`, `condition`, `fingerprint`) | asserting a tool exists, skipping already-done work, hashing external state (a tool version) |
| `description`                      | text shown by `moon task` and `moon project`; write it for non-obvious tasks |
| task `tags`                        | selecting tagged tasks of a project: `moon run 'frontend:#quality'`        |

## 7. Tokens you will need

| Token                                  | Expands to                                              |
| -------------------------------------- | ------------------------------------------------------- |
| `$projectSource`                       | project path from the workspace root (`apps/frontend`)  |
| `$projectRoot`, `$workspaceRoot`       | absolute paths                                          |
| `$project`, `$task`, `$target`         | ids of the running task                                 |
| `@files(group)`, `@globs(group)`       | matched files, or the group's glob patterns             |
| `@dirs(group)`, `@root(group)`         | matched directories, or their lowest common directory   |
| `@in(0)`, `@out(0)`                    | the task's own input or output by index                 |
| `@meta(key)`                           | a value from the project's `project:` metadata          |

Absolute tokens (`$workspaceRoot`) in `args` become part of the hash, so a machine with a different checkout path gets a different hash. Prefer `$projectSource` and workspace-relative paths when the task runs from the workspace root.
