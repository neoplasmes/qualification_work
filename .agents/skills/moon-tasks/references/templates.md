# Templates and `moon generate`

moon scaffolds files from templates: a folder with a `template.yaml` and files rendered with Tera. Everything below was run on moon 2.5.6 in a scratch workspace.

The repository has no templates yet. Until the user approves the first one, your job is to notice repetition and propose a template, not to create one on your own.

## When to propose a template

Propose when any of these is true:

- you are about to create a structure that already exists at least twice (a page slice, a widget, a package, an ADR, a UCD record, a command with its port, a repo port with its adapter);
- you just created the second copy of something by hand;
- the user asks for "another one like X".

The proposal names the repeated paths you found, the variables the template would take, its destination, and what it saves. Example:

> `apps/frontend/src/ui/widgets/` has 8 widgets with the same shape: `<Name>.widget.tsx`, `<name>.widget.module.css`, `index.ts`. A `frontend-widget` template with one variable `name` would create all three with correct casing in one command: `moon generate frontend-widget -- --name "order summary"`. Capture it?

After the user agrees, create the template, generate one real instance with it, and compare the result with an existing hand-written one.

## Anatomy

```text
tools/templates/
    frontend-widget/
        template.yaml
        widget.tsx.tera
        widget.module.css.tera
        index.ts.tera
```

`template.yaml`:

```yaml
title: Frontend widget
description: Widget slice with its CSS module and barrel.
destination: /apps/frontend/src/ui/widgets/[name | pascal_case]
variables:
    name:
        type: string
        default: ""
        required: true
        prompt: Widget name?
```

`widget.tsx.tera`:

```twig
{% set component = name | pascal_case %}
---
to: {{ component }}.widget.tsx
---
import styles from './{{ name | camel_case }}.widget.module.css';

export function {{ component }}() {
	return <section className={styles.root} />;
}
```

Run: `moon generate frontend-widget --defaults -- --name "order summary"` creates `apps/frontend/src/ui/widgets/OrderSummary/{OrderSummary.widget.tsx, orderSummary.widget.module.css, index.ts}`.

## Rules for templates in this repository

- Templates live in `tools/templates/<template-id>/` (repository tooling), registered once in `.moon/workspace.yaml` under `generator.templates`. Template folder and file names are kebab-case like everything in `tools/`; the real file names are produced by `to:` frontmatter. This location is a proposal until the user approves it.
- The `.tera` extension keeps editor highlighting and is removed on output. A file whose content conflicts with Tera syntax uses `.raw` instead and is copied as is.
- Generated output must already satisfy the contracts: naming from `ARCHITECTURE.repo.md#naming`, page and widget slices from `ARCHITECTURE.frontend.md`, no folder that contains only `index.ts`, no empty segment. Do not generate `model/` or `ui/` placeholders; the code that needs them creates them.
- Variables are named in camelCase. Prefer `enum` for closed choices (`scope: major | minor`) and `boolean` for optional files, rendered with `skip:` frontmatter.
- A template never edits existing files: registering a project in `.moon/workspace.yaml` or `pnpm-workspace.yaml` stays a manual step, listed in the template `description`.
- A template is tested by generating into a scratch destination with `--to` and `--dry-run` first, then for real, then running `moon run :check`.

## Tera and moon features you will need

| Feature                          | Syntax                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| Variable                         | `{{ name }}`                                                   |
| Case filters (moon)              | `pascal_case`, `camel_case`, `kebab_case`, `snake_case`, `upper_snake_case`, `lower_case`, `upper_case` |
| Path filters (moon)              | `path_join(part = "x")`, `path_relative(from = other)`         |
| Interpolation in paths           | `[name | pascal_case]` in `destination` or file names          |
| Rename the output file           | frontmatter `to: {{ name | pascal_case }}.page.tsx`            |
| Conditional file                 | frontmatter `skip: {{ not withModel }}`                        |
| Overwrite without prompting      | frontmatter `force: true`                                      |
| Current date                     | `{{ now() | date(format="%Y-%m-%d") }}` (checked)              |
| Inherit another template         | `extends: [base]` in `template.yaml`                           |
| Shared fragments                 | any file with `partial` in its path, used with `{% include %}` |
| Always-available variables       | `dest_dir`, `dest_rel_dir`, `working_dir`, `workspace_root`    |

Commands: `moon templates` lists templates, `moon template <id>` shows files and variables, `moon generate <id> --to <dir> --defaults --dry-run -- --var value` renders without writing. Boolean variables accept `--flag` and `--no-flag`. The moon MCP server exposes `get_templates` and `get_template` for agents.
