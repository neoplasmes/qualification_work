# Porting moon configs from another repository

Configs from other repositories are references, not templates. Port the intent and rewrite the form to this contract. The examples come from `neoplasmes/qualification_work` (moon 2.3, pnpm scripts, Prettier, SCSS, Bash scripts, Docker Compose inside tasks).

## Translation table

| In the source repository                                   | In this repository                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `command: pnpm lint` (package.json script)                 | the tool itself: `bun --bun oxlint ...`; `package.json` has no `scripts`           |
| `prettier`, `fmt` with `cache: false`                      | inherited `fmt` (dprint), cached on its inputs                                     |
| `lint` that runs TS and style linters together             | `lint` and `lint-css`, each with its `-fix` twin                                   |
| `lint-fix` with `cache: false`                             | cached `lint-fix` with the same inputs as `lint`                                   |
| `test`                                                     | `test-unit`, `test-int` or `test-e2e`                                              |
| `e2e`                                                      | `test-e2e`                                                                         |
| `preview`                                                  | `start` (`deps: ~:build`, `preset: server`)                                        |
| `tidy` (`go mod tidy`)                                     | `lock`                                                                             |
| `dev-compose-up`, `test-compose-up`                        | `compose-up`, `compose-down` (one stack per project, Windows routes through WSL)   |
| `toolchain: system` on every task                          | nothing: tools come from proto and the default toolchain                           |
| `script:` in Bash (`set -a; source .env`, `RC=$?`)         | `options.envFile`, `deps`, or a Nushell script in `tools/`                         |
| `*.config.{js,ts}` in `cfg`                                | the project's own configs by name; root configs in `cfg-*` groups                  |
| `../../../.golangci.yaml` in a command                     | input `/.golangci.yaml`, command `$workspaceRoot/.golangci.yaml`                   |
| per-project copies of `typecheck`, `lint`, `lint-fix`      | inherited from `.moon/tasks/*.yaml`                                                |
| `inputs` repeated in every task                            | file groups plus a YAML anchor or `extends`                                        |
| `deps: ^:build` everywhere                                 | only where a dependency ships build output, with `cacheStrategy: outputs`          |

## Example 1: React SSR client (`apps/node/client`)

Before:

```yaml
fileGroups:
  cfg:
    - "package.json"
    - "tsconfig.json"
    - "*.config.{js,ts}"
  src:
    - "{src,server,vite}/**/*"
    - "!**/*.test.{js,ts,tsx}"
  test:
    - "{src,server}/*.test.{js,ts,tsx}"
    - "test/**/*"

tasks:
  build:
    command: "pnpm build"
    deps: ["^:build"]
    inputs: ["@group(src)", "@group(cfg)", "index.html"]
    outputs: ["dist"]
  build-client:
    command: "pnpm build:client"
    inputs: ["src/**/*", "vite.config.ts", "index.html"]
    outputs: ["dist/client"]
  build-server:
    command: "pnpm build:server"
    deps: ["^:build"]
    inputs: ["server/**/*", "src/**/*", "tsup.config.ts", "vite.config.ts"]
    outputs: ["dist/server", "dist/server.js"]
  fmt:
    command: "pnpm prettier"
    options: { cache: false }
  lint:
    command: "pnpm lint"
  test:
    command: "pnpm test"
```

Problems:

- `{src,server,vite}/**/*` hashes every file, including SCSS, HTML and test fixtures; the `!**/*.test.*` exclusion misses `src/test/` helpers.
- `{src,server}/*.test.*` has no `**`, so only top-level tests are hashed: a nested `Button.test.tsx` change does not invalidate `test`.
- `*.config.{js,ts}` picks up `oxlint.config.ts`, `prettier.config.js` and `stylelint.config.js`, which are per-project copies of what is root-owned here.
- `build` repeats both sub-builds' work, so `build-client` and `build-server` are only shortcuts that drift from it.
- Every task goes through `pnpm <script>`, so the real command is invisible to moon and the hash.

After:

```yaml
language: typescript
layer: application

tags:
    - node
    - css

dependsOn:
    - repo
    - primitive-server

fileGroups:
    src:
        - "{src,server,vite}/**/*.{ts,tsx}"
        - "!src/**/*.{test,test.int}.{ts,tsx}"
        - "!server/**/*.test.ts"
        - "!src/test/**"
    test-unit:
        - src/**/*.test.{ts,tsx}
        - server/**/*.test.ts
        - src/test/**/*.ts
    css:
        - src/**/*.css
    cfg:
        - "{package,tsconfig}.json"
        - "{vite,vitest,tsup}.config.ts"
        - index.html
    assets:
        - server/*.html

tasks:
    test-unit:
        command: bun --bun vitest run --config apps/client/vitest.config.ts
        inputs:
            - "@group(src)"
            - "@group(test-unit)"
            - "@group(css)"
            - "@group(cfg)"

    dev:
        command: bun --bun server/server.ts
        preset: server
        options:
            envFile: .env
            runFromWorkspaceRoot: false

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
            - "@group(assets)"
        outputs:
            - dist/server
        deps:
            - target: primitive-server:build
              cacheStrategy: outputs
        options:
            internal: true
            runFromWorkspaceRoot: false

    build:
        command: noop
        inputs: []
        deps:
            - client:build-client
            - client:build-server

    start:
        command: bun --bun dist/server/server.js
        preset: server
        deps:
            - client:build
        options:
            envFile: .env
            runFromWorkspaceRoot: false
```

`fmt`, `lint`, `lint-fix`, `lint-css`, `lint-css-fix`, `typecheck` and `check` come from `.moon/tasks/` through the `node` and `css` tags and the `typescript` language. SCSS became CSS because this repository uses plain CSS Modules. The directory would also lose its language segment: `apps/client`, not `apps/node/client`.

## Example 2: Go service (`apps/go/auth`)

Before (abridged):

```yaml
fileGroups:
  src:
    - "{cmd,internal}/**/*.go"
    - "!**/*_test.go"
  test:
    - "**/*_test.go"

tasks:
  dev:
    script: "set -a; source .env; set +a; go run ./cmd/auth/main.go"
    toolchain: system
  tidy:
    command: "go mod tidy -v"
  fmt:
    command: "golangci-lint fmt --config ../../../.golangci.yaml ./..."
    options: { cache: false }
  lint:
    command: "golangci-lint run --config ../../../.golangci.yaml ./..."
  test:
    script: |
      docker compose -f docker-compose.test.yaml up -d ...
      go test -tags=integration -count=1 ./test/integration/... || RC=$?
      docker compose -f docker-compose.test.yaml down ...
  swagger:
    script: "swag init -d cmd/auth,internal/... -o docs ..."
    outputs: ["docs"]
```

After: the project keeps only what is specific to it. Formatting, linting, `typecheck`, `test-unit`, `test-int` and `check` come from `.moon/tasks/go.yaml` (see [polyglot.md](polyglot.md)).

```yaml
language: go
layer: application

fileGroups:
    src:
        - "{cmd,internal}/**/*.go"
        - "!**/*_test.go"
    test-unit:
        - "{cmd,internal}/**/*_test.go"
        - "!**/*_int_test.go"
    test-int:
        - "**/*_int_test.go"
        - test/integration/**/*.go
    cfg:
        - go.{mod,sum}

tasks:
    lock:
        command: go mod tidy
        options:
            cache: false

    swagger:
        command:
            swag init --dir cmd/auth,internal/adapters/driving/http --generalInfo main.go
            --output docs --v3.1 --parseInternal --outputTypes json
        inputs:
            - "@group(src)"
            - "@group(cfg)"
        outputs:
            - docs/swagger.json

    test-int:
        deps:
            - auth:compose-up
        options:
            mutex: auth-test-stack

    dev:
        command: go run ./cmd/auth
        preset: server
        options:
            envFile: .env

    build:
        command: go build -o bin/auth ./cmd/auth
        inputs:
            - "@group(src)"
            - "@group(cfg)"
        outputs:
            - bin/auth
```

What changed and why:

- `fmt` became dprint with a `gofmt` exec entry, so one formatter owns every language and `fmt` is cached.
- `tidy` became `lock`: it refreshes `go.sum`, which is this ecosystem's lockfile.
- The Bash test script that started and stopped Compose became an inherited `test-int` with a dep on `compose-up` and a `mutex`. Starting and stopping a stack are their own tasks, so a failed test never hides a teardown problem, and Windows runs Compose through WSL.
- `swagger` is a generator: precise inputs, a file output, cached. Its name is a project helper until the repository settles a name for generators.
- The language segment disappears from the path: `apps/auth`.

## Example 3: e2e suite (`e2e/backend`)

| Before                                 | After                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| `src: ["**/*"]`                        | `src: ["{scenarios,utils}/**/*.ts", "setup.ts"]`              |
| tasks `prettier`, `e2e`                | inherited `fmt`; `test-e2e`                                   |
| inline Compose start, test, teardown   | `test-e2e` with deps on the stack task and a `mutex`          |
| `export NODE_EXTRA_CA_CERTS=...`       | `env:` on the task, path through `$projectRoot`               |
