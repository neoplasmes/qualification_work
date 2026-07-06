# Polyglot projects

The task names never change with the language. A new ecosystem brings a new `.moon/tasks/<ecosystem>.yaml`, a dprint formatter entry, pinned tools in `.prototools`, and projects that select it through `language` or `tags`. The Go, Rust and Terraform configs below were loaded and expanded with moon 2.5.6 (`moon task <target> --json`, `@files` listings); the tools themselves were not run.

## Checklist for a new language

1. Pin the compiler, linter and test tools in `.prototools` (proto plugin in `.proto/plugins/` when proto has no built-in one).
2. Teach dprint the file extension: a native dprint plugin, or a new entry in the `exec.commands` of `dprint.jsonc` that wraps the language formatter, plus the extension in `includes`. `fmt` stays `dprint fmt $projectSource`.
3. Create `.moon/tasks/<ecosystem>.yaml` with the shared groups, `lint`, `lint-fix`, `typecheck`, `test-*` and the `check` proxy for that ecosystem.
4. Give each project its file groups (see [patterns.md](patterns.md)) and `language`.
5. Register the projects in `.moon/workspace.yaml`, and in the language's own workspace file when it has one (`go.work`, a Cargo workspace).
6. Map the language's fixed test names onto `test-unit` and `test-int` instead of inventing new task names.

## Formatter entries for dprint

```jsonc
{
	"commands": [
		{ "command": "gofmt", "exts": ["go"] },
		{ "command": "rustfmt --edition 2024 --emit stdout", "exts": ["rs"] },
		{ "command": "terraform fmt -", "exts": ["tf", "tfvars"] },
		{ "command": "ruff format --stdin-filename {{file_path}} -", "exts": ["py"] }
	]
}
```

Add these to the existing `exec.commands` list only when the language arrives, together with the extension in `includes`.

## Go

Go tools work per module, so the ecosystem file runs tasks inside the project. Integration tests keep Go's `_test.go` suffix: `*_int_test.go` with a `//go:build integration` constraint. A `.int/` folder does not work in Go, because `./...` skips directories that start with `.`.

`.moon/tasks/go.yaml`:

```yaml
inheritedBy:
    languages: go

implicitInputs:
    - file: /go.work
      optional: true

fileGroups:
    test-unit: []
    test-int: []
    cfg-lint-go:
        - /.golangci.yaml

taskOptions:
    runFromWorkspaceRoot: false

tasks:
    fmt:
        command: dprint fmt $projectSource
        inputs:
            - "@group(src)"
            - "@group(test-unit)"
            - "@group(test-int)"
            - /dprint.jsonc
        deps:
            - ~:lint-fix
        options:
            runFromWorkspaceRoot: true

    lint:
        command: golangci-lint run --config $workspaceRoot/.golangci.yaml ./...
        inputs:
            - "@group(src)"
            - "@group(test-unit)"
            - "@group(test-int)"
            - "@group(cfg)"
            - "@group(cfg-lint-go)"

    lint-fix:
        extends: lint
        args: --fix

    typecheck:
        command: go vet ./...
        inputs:
            - "@group(src)"
            - "@group(test-unit)"
            - "@group(test-int)"
            - "@group(cfg)"

    test-unit:
        command: go test -count=1 ./...
        inputs:
            - "@group(src)"
            - "@group(test-unit)"
            - "@group(cfg)"

    test-int:
        command: go test -count=1 -tags integration -run '^TestInt' ./...
        inputs:
            - "@group(src)"
            - "@group(test-int)"
            - "@group(cfg)"

    check:
        command: noop
        inputs: []
        deps:
            - ~:fmt
            - ~:lint-fix
            - ~:typecheck
```

`apps/<service>/moon.yaml`:

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
        - test/integration/**/*.{go,hurl}
    migrations:
        - migrations/<[0-9]:14>_*.{up,down}.sql
    cfg:
        - go.{mod,sum}

tasks:
    lock:
        command: go mod tidy
        options:
            cache: false

    dev:
        command: go run ./cmd/<service>
        preset: server
        options:
            envFile: .env

    build:
        command: go build -o bin/<service> ./cmd/<service>
        inputs:
            - "@group(src)"
            - "@group(cfg)"
        outputs:
            - bin/<service>
```

## Rust

One Cargo workspace at the root (`/Cargo.toml`, `/Cargo.lock`), each crate a project. Unit tests live inside `src/` under `#[cfg(test)]`; integration tests are Cargo's `tests/` folder.

`.moon/tasks/rust.yaml`:

```yaml
inheritedBy:
    languages: rust

implicitInputs:
    - /Cargo.toml
    - /Cargo.lock

fileGroups:
    test-int: []
    cfg-lint-rust:
        - /clippy.toml

tasks:
    lint:
        command: cargo clippy --all-targets --manifest-path $projectSource/Cargo.toml -- -D warnings
        inputs: &rust-lint-inputs
            - "@group(src)"
            - "@group(test-int)"
            - "@group(cfg)"
            - "@group(cfg-lint-rust)"

    lint-fix:
        command:
            cargo clippy --fix --allow-dirty --allow-staged --all-targets
            --manifest-path $projectSource/Cargo.toml
        inputs: *rust-lint-inputs

    typecheck:
        command: cargo check --all-targets --manifest-path $projectSource/Cargo.toml
        inputs:
            - "@group(src)"
            - "@group(test-int)"
            - "@group(cfg)"

    test-unit:
        command: cargo test --lib --manifest-path $projectSource/Cargo.toml
        inputs:
            - "@group(src)"
            - "@group(cfg)"

    test-int:
        command: cargo test --test '*' --manifest-path $projectSource/Cargo.toml
        inputs:
            - "@group(src)"
            - "@group(test-int)"
            - "@group(cfg)"
```

`lint-fix` uses an anchor and not `extends`, because `--fix` must stay before `--`. `fmt` and `check` follow the Go file. Root-level `lock` for Cargo is `cargo update --workspace`. A crate compiled to WebAssembly adds a project `build` task whose `outputs` are the generated `pkg/` folder, and consumers depend on it with `cacheStrategy: outputs`.

## Terraform and other infrastructure (`env/`)

`language` accepts any value, so infrastructure projects say what they are. Environment operations are not cached and are interactive.

```yaml
language: terraform
layer: configuration

tags:
    - terraform

fileGroups:
    src:
        - "**/*.{tf,tfvars}"

tasks:
    lint:
        command: tflint --recursive
        inputs:
            - "@group(src)"
            - /.tflint.hcl
        options:
            runFromWorkspaceRoot: false

    lint-fix:
        extends: lint
        args: --fix

    plan:
        command: terragrunt plan
        preset: utility
        options:
            runFromWorkspaceRoot: false

    apply:
        command: terragrunt apply
        preset: utility
        options:
            runFromWorkspaceRoot: false
```

## HTTP API tests with Hurl

Hurl scenarios are integration tests of one service (`test-int`) or end-to-end tests across services (`test-e2e` in `e2e/<suite>/`).

```yaml
fileGroups:
    test-int:
        - test/integration/**/*.hurl

tasks:
    test-int:
        command: hurl --test --variables-file test/integration/local.env @files(test-int)
        inputs:
            - "@group(src)"
            - "@group(test-int)"
            - test/integration/local.env
        deps:
            - api:build
        options:
            mutex: api-local-port
            runFromWorkspaceRoot: false
```

`mutex` keeps two tasks that bind the same port or database from running at the same time.

## Python (if it ever appears)

| Task        | Command                                   |
| ----------- | ----------------------------------------- |
| `fmt`       | dprint with the `ruff format` exec entry  |
| `lint`      | `ruff check $projectSource`               |
| `lint-fix`  | `ruff check --fix $projectSource`         |
| `typecheck` | `pyright $projectSource`                  |
| `test-unit` | `pytest $projectSource/tests -m "not int"`|
| `test-int`  | `pytest $projectSource/tests -m int`      |
| `lock`      | `uv lock`                                 |

Implicit inputs: `/pyproject.toml`, `/uv.lock`.

## Nushell scripts in `tools/`

`tools/` is owned by the root project. There is no dprint plugin for Nushell, so `.nu` files are checked by parsing them. `nu-check` returns `false` instead of failing, so the loop lives in a script that turns a parse error into a non-zero exit (`nu-check --as-module` for files with `export def`):

```yaml
fileGroups:
    tools-nu:
        - /tools/**/*.nu

tasks:
    lint-nu:
        command: nu --no-config-file tools/nu-check/nu-check.nu @files(tools-nu)
        inputs:
            - "@group(tools-nu)"
```

This task and its script are a proposal, not part of the root `moon.yaml` yet.
