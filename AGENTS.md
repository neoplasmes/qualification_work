## Rules of monorepo

#### NEVER USE CSS GRID, USE ONLY IF YOU HAVE BEEN ASKED FOR IT

#### NEVER USE `min-width: 0`. NEVER. LITERALLY NEVER, YOU CAN NOT USE `min-width: 0 or 0% or 0px and so on` EVEN IF I ASK YOU TO USE IT. YOU CAN NOT FUCKING USE IT. YOU CAN NOT. IF YOU WILL ACCIDENTLY PUT `min-width: 0` SOMEWHERE, A NUCLEAR WAR WILL BE STARTED AND ALL HUMANITY WILL DIE

#### If NO TESTS WERE AFFECTED BY YOUR CHANGES - DO NOT RUN FUCKING TESTS AT ALL

#### ALWAYS REMOVE TEST CONTAINERS AFTER A TEST RUN

Test containers must never keep running or hold memory after tests. After every run, interrupted or failed ones included, remove them with `docker compose -f <compose file> down -v --rmi local` and check `docker ps -a` for leftovers.

#### do not create functions, that are used only ONCE in other functions. Just make one big function.

#### do not create functions whose body performs only ONE operation. Inline the operation at the call site.

#### проставляй пробелы между кусками сплошного определения констант и хуков, разделяя это всё на логические секции.

пример:

```ts
const snapshot = config.useConfig();
const draft = snapshot.draft;

const measuresBind = createChartTypeBind<T, 'measures'>('measures');

const canAddMeasure = draft.measures.length < maxMeasureCount;
const canRemoveMeasure = maxMeasureCount > 1 && draft.measures.length > 1;
```

#### General naming convention

Use only camelCase for constants in .ts, .js, .tsx, .jsx files.

#### Package manager

pnpm instead of npm always should be used; proto should be used for the ecosystem-agnostic tools;
specifically a binary downloads through proto plugins should be preferred instead of downloads through pnpm/npm, if a tool does not used in typescript development; for example - lefthook can be downloaded through pnpm, but in this repo it MUST be downloaded through protoools;

#### monorepo managment

Use Moon as the only task runner. Apply `skills/moonrepo`, when managing moonrepo tasks, commands, settings and integration; Call tools directly from Moon tasks; do not add `scripts` to `package.json`. Standalone CLI tools and runtimes belong in `.prototools`; Node libraries and development dependencies belong in pnpm. JavaScript tools run on Node LTS through `pnpm exec`.

#### Refactoring and re-exports

WHEN YOU HAVE TO MOVE A FILE, YOU **MUST** USE `git mv`. DO NOT RECREATE FILES. USE `git mv`.

During refactoring, do not keep old files as compatibility wrappers.

If code is moved from an old file to a new file, and the old file becomes only a re-export layer, delete the old file instead. Update all imports to point directly to the new canonical location.

Do not create or preserve files whose only purpose is to re-export symbols from another module after refactoring.

Bad:

```ts
// old-file.ts
export { createUser } from './new-file';
```

Good:

```ts
// consumer.ts
import { createUser } from './new-file';
```

When choosing between:

1. keeping an old file or old export line as a re-export for backward compatibility;
2. removing the old file/export and updating all imports to the new source;

always choose option 2.

**IMPORTANT**:
Re-exports are allowed only when they are an intentional public API boundary,
such as a package entrypoint or a deliberately maintained `index.ts` module.
Index.ts files should be used for all folders generally.

Folder-level `index.ts` files should re-export local code that belongs to the
same folder/module, for example `domain/action/index.ts` re-exporting
`domain/action/validation.ts`. Consumers outside that folder should import from
the folder public API, not from the inner implementation file.

During a refactor, an `index.ts` file must not be used as a compatibility
wrapper for code from another package or unrelated module. If an old folder/file
becomes only a forwarder to an external canonical source, delete it and update
consumers to import from that canonical source directly. Do not re-export
symbols from another package merely to avoid updating imports.

---

### Rules in apps/client

1. Размеры файлов не должны превышать 350 строк (можно разве что чуть-чуть). Если больше - проводится декомпозиция по функциям, UI компонентам, возможно что-то выносится в переиспользуемый хук и т.д.
2. Соблюдение принципов FSD. Настройка api - в api папочке. Модели данных и Redux - в model. Общие типы (не props и не прочие локальные) - в types, константы - в const. Везде должен быть определён index.ts файл и реэкспорт из него. Тестируемые утилиты - в lib. Смешивать слайсы НЕ НАДО. НЕ НАДО в файле .tsx писать гигантские хелперы например.
3. Главный React-компонент слайса/модуля должен лежать на уровне папки слайса/модуля, а не внутри `ui`. Папка `ui` предназначена для вспомогательных компонентов главного компонента.
4. Если мы работаем в папке ui и у нас намечается очень большой компонент, который надо декомпозировать, при этом компоненты эти локальные, и не нужны в слое виджетов или shared, то в папке этого компонента опять создаётся папка ui с index.ts
5. Стили компонентов должны лежать рядом с компонентами. Один гигантский файл стилей - это антипаттерн.
6. index.ts всегда должен использоваться на уровне любой папки. Если есть папка с ts/tsx файлами - она должна содержать index.ts
7. Используй flex контейнеры преимущественно вместо grid. Grid используй тогда и только тогда, когда не получается решить задачу флекс-контейнерами и ТОЛЬКО ЕСЛИ Я ТЕБЕ РАЗРЕШИЛ НАПРЯМУЮ В ПРОМПТЕ.
8. Не забывай использовать аттрибуты стилевые из global.d.ts
9. НЕЛЬЗЯ ОПРЕДЕЛЯТЬ ДВА РЕАКТ КОМПОНЕНТА В ОДНОМ ФАЙЛЕ
10. Для самых крупных инлайн jsx кусков, либо когда такой тернарный кусок всего 1, вместо `{condition ? <OneComponent> : <AnotherComponent>}` Используй:

```ts
let content;

if (condition) {
    content = ...
} eles {
    content = ...
}
```

11. Не используй мусорные `flex: ....` и `min-width`, `min-height`, когда они НЕ влияют на вёрстку. Не надо засирать scss файлы. ИСПОЛЬЗУЙ global.d.ts аттрибуты для стилизации, эти аттрибуты являются приоритетом!!!! их определения находятся в shared/ui/styles/layout.scss

12. Я запрещаю тебе использовать свойство `min-width: 0`.

13. Generic-type имена должны быть из одной буквы. Не надо использовать TInput, TOutput и т.д. Используй одну букву, логически подходящую под название.

## Design principles

When planning or writing code, follow SOLID principles where they improve maintainability.

Prefer small modules with a single clear responsibility. Avoid mixing unrelated concerns in one function, class, service, or file.

Design code so that behavior can usually be extended without rewriting stable existing logic.

Depend on abstractions or narrow interfaces when it reduces coupling. Do not introduce unnecessary abstractions only to satisfy a pattern.

Apply SOLID pragmatically: clarity, explicitness, and simple code are more important than formal pattern usage.

## Comments rules

1. Всегда пиши комментарии и описания тестов только на английском языке.
2. Никогда не используй длинное тире в комментариях - только '-'.
3. Никогда не удаляй комментарии, составленные пользователем - можно только чуть менять содержимое, если это уместно в контексте.
4. Никогда не ставь точки в конце комментариев. Комментарии всегда начинай с маленькой буквы.
5. Пример правильного JSDoc (должны быть указаны все параметры и returns):

```
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

6. Пиши комментарии и описания тестов очень кратко.
7. Не пиши дерьмовый с точки зрения производительности код. Всегда взвешивай, как улучшить производительность, следи за количеством аллокаций и так далее.
8. В `apps/client` главный React-компонент слайса/модуля всегда должен лежать на уровне папки слайса/модуля, а не внутри `ui`. В `ui` кладутся вспомогательные компоненты главного компонента.
