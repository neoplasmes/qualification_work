# BI Tool design system

Source-consumed React 19 package. Import `@qualification-work/design-system/theme.css` once in the Vite entrypoint, then import components and their prop types from `@qualification-work/design-system`. The public root exports 23 components: HStack, VStack, Text and 20 controls. Documentation-only compositions are not exported.

Wrap the consumer subtree in `data-theme="paper"` to opt into reset, default typography and keyboard focus. Tokens and locally bundled fonts are global; reset/default typography are scoped. The source font order is preserved: system sans before Geist, then Golos Text for Cyrillic fallback. Fontsource supplies local Cyrillic subsets.

`src/theme/tokens.json` is an exact snapshot of the authoritative `refs/qw-redesign/tokens.json`. It lists the entire permissible vocabulary. Hand-maintained `tokens.css` projects35 named color/space/radius/shadow/border tokens plus46 mechanical typography fields, exactly81 variables. There is no generator, alias layer, additional spacing/type scale, motion token or external shadow. Root Stylelint derives the contract from JSON and checks names, values, variable references and property categories; adding a CSS variable cannot expand the allowlist.

Text variants use exact source names: display, heading-lg, heading, heading-sm, lead, body, body-sm, ui, typed, data, label, caption. Each owns its complete typography with unitless line heights and normal tracking when absent. Data always uses tabular numerals. Caption is only for sheet/step numbering. Muted text on canvas uses ink-3 (`tone="mutedCanvas"`); ink-2 is for paper. Accent orange is for large numerals, not small text.

HStack/VStack use native flex with optional gap4/8/12/16/20/24/28/32/40/48/64/80/120. Omitted gap is native zero, without a variable bridge. Layout props are as/gap/align/justify/wrap/fullWidth and preserve native props/ref. Typography/reset/focus use the same canonical variables. Component bounds such as44/52px control height,72px step buttons and340px popup width are private geometry; spacing and typography use only the source scale.

Button supports primary/ghost/danger and regular44px/large52px, both using ui typography. IconButton requires an accessible label. Link supports anchors/native buttons with normal/quiet/danger/current styles. Input/Textarea/Select preserve native controlled/default props; Select is square and native. Checkbox/Radio preserve browser semantics.

Field accepts one direct control child and establishes associations on the first render, including SSR. ID precedence is NumberField inputProps.id, direct control.id, Field.id, then generated ID. Explicit control IDs win a conflicting Field ID; label/help/error use that actual control target. Required description/error IDs merge with external descriptions. A Field error cannot be negated by a consumer aria-invalid=false. Custom composites can consume fieldContext and follow the same direct-child contract; unrelated multi-option native groups should use fieldset/legend.

NumberField delegates bounded editable numeric input/stepping to Base UI and accepts min/max/step/value/defaultValue/onValueChange; empty input reports null. Its root and input className props accept strings; inputProps preserve input IDs, names and refs while merging accessibility associations. Choice delegates radio selection and arrow navigation to Base UI. Menu delegates Escape/outside dismissal/typeahead/trigger-focus restoration, supports navigation/action callbacks, disabled entries, separators and controlled/defaultOpen state. Its portal opts into the paper theme. Trigger classes are composed.

Stamp/Marker/ValueDiff/Sheet/Divider/Notice provide source stamp, highlighted change, rectangular sheet and dashed rule visuals. Token is a native typed button with value/field/add variants; sentence composition and selection stay in the consumer, demonstrated with Base UI Menu in its story. Stat combines label, heading-lg value and optional data comparison without a frame. The caller supplies comparison words and explicitly marks adverse changes with deltaTone="danger"; the number sign never determines color. Phone/Datasets/Gallery compositions demonstrate the reusable library. Original screen-specific sizes were normalized to the canonical token vocabulary, so approved geometry may differ from the imperfect HTML/PNG references. Phone quantity starts2 and is bounded1..14. Datasets displays rows75..84, selected row78 and an initially open action menu. Narrow desktop sections stack and the table scrolls within a named focusable region.

All operations use Moon:

- `moon run root:lock`, then `moon run root:install-dependencies`
- `moon run design-system:dev` (port6006, no automatic browser)
- `moon run design-system:typecheck design-system:lint design-system:lint-css`
- `moon run design-system:test-unit -- tests/fieldAssociation.test.ts tests/tokenContract.test.ts` (focused changed contracts)
- `moon run design-system:build` (dist/storybook)

Theme cascade order reset/tokens/primitives/typography/components is prepended by root PostCSS. Consumers use the root PostCSS config for the same layer order/transforms. Compatibility floor is Chrome/Edge109, Firefox115, Safari/iOS15.6. Preset-env transforms nesting/modern colors while preserving variables; it does not polyfill runtime JavaScript/browser APIs. Runtime browser validation covers installed Chromium. Root lint preserves the existing client SCSS override and prohibits Grid/zero min-width in the DS.

Story IDs: compositions-phone--reference, compositions-datasets--reference, compositions-gallery--reference. Source folder APIs aggregate through local index.ts files. No application migration is part of this package.

Storybook documentation budget (uncompressed minified output): preview≤1.5MB, accessibility engine≤0.8MB, UI vendor chunk≤0.65MB. The default500KB Vite warning stays visible. The budget is documented, not an automated gate; source components do not require documentation engines.
