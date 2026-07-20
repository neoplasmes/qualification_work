import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// prettier-ignore
const fixtures = [
    ['rejects concrete repo imports outside main', 'ui/pages/home/model/home.ts', '@/env/repos/user', 1],
    ['rejects concrete repo root barrels', 'env/cache/read/read.ts', '@/env/repos', 1],
    ['rejects legacy repo root barrels', 'pages/Profile/model/profile.ts', '@/env/repos', 1],
    ['rejects relative concrete repos', 'app/queries/user/user.ts', '../../../env/repos/user', 1],
    ['rejects concrete repo types', 'app/ports/repos/user/user.ts', '@/env/repos/user', 1, true],
    ['accepts main repo wiring', 'main/runtime/runtime.ts', '@/env/repos/user', 0],
    ['accepts repo schemas internally', 'env/repos/user/user.repo.ts', './user.schema', 0],
    ['accepts repo test helpers internally', 'env/repos/user/user.test.ts', './user.schema', 0],
    ['rejects another repo implementation', 'env/repos/session/session.repo.ts', '../user', 1],
    ['accepts development dependency construction', 'test/runtime/runtime.test.ts', '@/env/repos/user', 0],
    ['accepts page test construction', 'ui/pages/home/model/home.test.ts', '@/env/repos/user', 0],
    ['rejects framework imports in app and core', 'app/queries/user/user.ts', 'react', 1],
    ['rejects core framework types', 'core/entities/user/user.ts', 'react', 1, true],
    ['rejects app query cache imports', 'app/queries/user/user.ts', '@tanstack/react-query', 1],
    ['rejects core database imports', 'core/entities/user/user.ts', '@tanstack/db', 1],
    ['rejects core Zustand imports', 'core/entities/user/user.ts', 'zustand/vanilla', 1],
    ['rejects legacy query cache imports', 'pages/Profile/model/profile.ts', '@tanstack/react-query', 1],
    ['rejects controller query cache imports', 'ui/pages/home/model/home.ts', '@tanstack/react-query', 1],
    ['accepts cache query integration', 'env/cache/read/read.ts', '@tanstack/react-query', 0],
    ['accepts main database integration', 'main/runtime/runtime.ts', '@tanstack/db', 0],
    ['accepts cache React context', 'env/cache/context/context.ts', 'react', 0],
    ['accepts cache React provider', 'env/cache/context/cacheProvider.tsx', 'react', 0],
    ['accepts cache React hooks', 'env/cache/useRead/useRead.ts', 'react', 0],
    ['rejects React outside cache hooks', 'env/cache/normalize/normalize.ts', 'react', 1],
    ['rejects transport React imports', 'env/transport/http/http.ts', 'react', 1],
    ['accepts UI React imports', 'ui/pages/home/Home.page.tsx', 'react', 0],
    ['accepts shared UI React imports', 'shared/ui/text/text.tsx', 'react', 0],
    ['rejects shared lib React imports', 'shared/lib/format/format.ts', 'react', 1],
    ['accepts UI model Zustand imports', 'ui/pages/home/model/home.ts', 'zustand', 0],
    ['accepts shared model Zustand imports', 'shared/model/theme/theme.ts', 'zustand/vanilla', 0],
    ['rejects shared lib Zustand imports', 'shared/lib/format/format.ts', 'zustand', 1],
    ['accepts React Router UI', 'ui/pages/home/Home.page.tsx', 'react-router', 0],
    ['accepts React Router bootstrap', 'main/client/entry.client.tsx', 'react-router', 0],
    ['rejects alternative router', 'main/router/router.ts', '@tanstack/react-router', 1],
    ['rejects page internal imports', 'main/router/router.ts', '@/ui/pages/home/model/state', 1],
    ['rejects relative page internals', 'ui/pages/settings/Settings.page.tsx', '../home/model/state', 1],
    ['rejects grouped page internals', 'main/router/router.ts', '@/ui/pages/executor/catalog/ui/card', 1],
    ['rejects page type implementation imports', 'main/router/router.ts', '@/ui/pages/home/types/input', 1, true],
    ['rejects page constants imports', 'main/router/router.ts', '@/ui/pages/home/const/options', 1],
    ['rejects page API imports', 'main/router/router.ts', '@/ui/pages/home/api/request', 1],
    ['rejects grouped page type imports', 'main/router/router.ts', '@/ui/pages/executor/catalog/types/input', 1, true],
    ['rejects grouped page constants imports', 'main/router/router.ts', '@/ui/pages/executor/catalog/const/options', 1],
    ['rejects relative grouped page config imports', 'main/router/router.ts', '../../ui/pages/executor/catalog/config/options', 1],
    ['rejects grouped page asset imports', 'main/router/router.ts', '@/ui/pages/executor/catalog/assets/image', 1],
    ['rejects page test imports', 'main/router/router.ts', '@/ui/pages/home/test/fixture', 1],
    ['rejects page types segment APIs', 'main/router/router.ts', '@/ui/pages/home/types', 1, true],
    ['accepts local page type APIs', 'ui/pages/home/Home.page.tsx', './types', 0, true],
    ['accepts local grouped page constant APIs', 'ui/pages/executor/catalog/Catalog.page.tsx', './const', 0],
    ['rejects page implementation imports', 'main/router/router.ts', '@/ui/pages/home/Home.page', 1],
    ['accepts page public APIs', 'main/router/router.ts', '@/ui/pages/home', 0],
    ['accepts grouped page public APIs', 'main/router/router.ts', '@/ui/pages/executor/catalog', 0],
    ['accepts local public APIs', 'ui/pages/home/Home.page.tsx', './model', 0],
    ['accepts local recursive public APIs', 'ui/pages/home/ui/Card/Card.tsx', './ui/Label', 0],
    ['rejects widget internals', 'ui/pages/home/Home.page.tsx', '@/ui/widgets/Chart/model/state', 1],
    ['accepts widget public APIs', 'ui/pages/home/Home.page.tsx', '@/ui/widgets/Chart', 0],
    ['recognizes nested core entities through relative APIs', 'core/entities/dataset/dataset.ts', '../user', 0],
    ['recognizes nested core entities', 'core/entities/dataset/dataset.ts', '@/core/entities/user', 0],
    ['rejects nested core outward edges', 'core/entities/dataset/dataset.ts', '@/app/queries/user', 1],
    ['rejects nested entity internals', 'app/queries/user/user.ts', '@/core/entities/user/user', 1],
    ['accepts entity public APIs', 'app/queries/user/user.ts', '@/core/entities/user', 0],
    ['accepts app port public APIs', 'app/queries/user/user.ts', '@/app/ports/repos/user', 0],
    ['accepts core shared utilities', 'core/entities/user/user.ts', '@/shared/lib/format', 0],
    ['rejects core shared UI', 'core/entities/user/user.ts', '@/shared/ui', 1],
    ['rejects app shared state', 'app/queries/user/user.ts', '@/shared/model/theme', 1],
    ['rejects shared project imports', 'shared/lib/format/format.ts', '@/core/entities/user', 1],
    ['rejects shared relative project imports', 'shared/lib/format/format.ts', '../../../app/queries/user', 1],
    ['rejects transport domain imports', 'env/transport/http/http.ts', '@/core/entities/user', 1],
    ['rejects transport cache imports', 'env/transport/http/http.ts', '@/env/cache/read', 1],
    ['accepts generic transport helpers', 'env/transport/http/http.ts', '@/shared/lib/format', 0],
    ['accepts repo ports', 'env/repos/user/user.repo.ts', '@/app/ports/repos/user', 0],
    ['accepts repo transport', 'env/repos/user/user.repo.ts', '@/env/transport/http', 0],
    ['rejects env UI dependencies', 'env/cache/read/read.ts', '@/ui/di', 1],
    ['rejects UI transports', 'ui/pages/home/model/home.ts', '@/env/transport/http', 1],
    ['accepts UI cache facade', 'ui/pages/home/model/home.ts', '@/env/cache/useRead', 0],
    ['rejects imports of main', 'ui/pages/home/model/home.ts', '@/main/runtime', 1],
    ['rejects new legacy imports', 'app/queries/user/user.ts', '@/entities/User', 1],
    ['rejects UI legacy imports', 'ui/pages/home/model/home.ts', '@/features/filterApplicationEntities', 1],
    ['preserves legacy app bootstrap', 'app/config/routes.tsx', '@/pages/Profile', 0],
    ['preserves legacy React bootstrap', 'app/ui/Layout/Layout.tsx', 'react-router', 0],
    ['preserves legacy upward protection', 'entities/User/model/user.ts', '@/pages/Profile', 1],
    ['preserves legacy cross-slice protection', 'pages/Profile/model/profile.ts', '@/pages/Datasets', 1],
    ['preserves legacy public APIs', 'pages/Profile/model/profile.ts', '@/entities/User/model/user', 1],
    ['rejects legacy concrete repo imports', 'pages/Profile/model/profile.ts', '@/env/repos/user', 1],
    ['accepts an exact legacy bridge', 'ui/pages/bridge/model/bridge.ts', '@/entities/User', 0],
    ['accepts the same relative bridge', 'ui/pages/bridge/model/bridge.ts', '../../../../entities/User', 0],
    ['rejects a neighboring legacy bridge', 'ui/pages/bridge/model/other.ts', '@/entities/User', 1],
    ['rejects a different legacy target', 'ui/pages/bridge/model/bridge.ts', '@/entities/Organization', 1],
    ['rejects legacy relative upward imports', 'entities/User/model/user.ts', '../../../pages/Profile', 1],
    ['rejects legacy relative cross-slices', 'pages/Profile/model/profile.ts', '../../Datasets', 1],
    ['rejects legacy relative internal imports', 'pages/Profile/model/profile.ts', '../../../entities/User/model/user', 1],
    ['protects legacy roots from false workspace entities', 'shared/lib/format/format.ts', '@/pages/Profile', 1],
] as const;

// prettier-ignore
const codeFixtures = [
    { name: 'rejects app browser globals', from: 'app/queries/browser/browser.ts', code: 'export const value = window.location;', expected: 1 },
    { name: 'rejects core browser fetch', from: 'core/processes/browser/browser.ts', code: 'export const fetched = fetch("/api");', expected: 1 },
    { name: 'rejects platform types except AbortSignal', from: 'app/queries/browser/browser.ts', code: 'export type Value = Request;', expected: 1 },
    { name: 'rejects callable browser globals', from: 'core/processes/notify/notify.ts', code: 'export const notify = () => alert("done");', expected: 1 },
    { name: 'rejects Window platform types', from: 'app/ports/repos/browserWindow/browserWindow.ts', code: 'export type Input = { target: Window };', expected: 1 },
    { name: 'rejects Document platform types', from: 'app/ports/repos/browserDocument/browserDocument.ts', code: 'export type Input = { target: Document };', expected: 1 },
    { name: 'rejects element platform types', from: 'app/ports/repos/browserElement/browserElement.ts', code: 'export type Input = { target: HTMLDivElement };', expected: 1 },
    { name: 'rejects event platform types', from: 'app/ports/repos/browserEvent/browserEvent.ts', code: 'export type Input = { event: MouseEvent };', expected: 1 },
    { name: 'rejects DOM-only type aliases', from: 'app/ports/repos/browserListener/browserListener.ts', code: 'export type Input = EventListenerOrEventListenerObject;', expected: 1 },
    { name: 'rejects DOM dictionary types', from: 'app/ports/repos/browserRequest/browserRequest.ts', code: 'export type Input = RequestInit;', expected: 1 },
    { name: 'rejects worker platform types', from: 'core/processes/worker/worker.ts', code: 'export type Input = DedicatedWorkerGlobalScope;', expected: 1 },
    { name: 'rejects additional platform constructors', from: 'core/processes/observer/observer.ts', code: 'export const observer = new ResizeObserver(() => {});', expected: 1 },
    { name: 'accepts shadowed callable globals', from: 'core/processes/localAlert/localAlert.ts', code: 'export const notify = (alert: () => void) => alert();', expected: 0 },
    { name: 'accepts shadowed DOM type names', from: 'app/ports/repos/localDocument/localDocument.ts', code: 'type Document = { id: string }; export const read = (document: Document) => document.id;', expected: 0 },
    { name: 'accepts DOM names as property names', from: 'core/entities/localProperties/localProperties.ts', code: 'export type Input = { HTMLDivElement: string; alert: () => void };', expected: 0 },
    { name: 'accepts standard types extended by DOM libraries', from: 'core/processes/standardMeta/standardMeta.ts', code: 'export type Input = ImportMeta;', expected: 0 },
    { name: 'accepts standard ECMAScript builtins', from: 'core/processes/builtins/builtins.ts', code: 'export const read = (input: Promise<Array<string>>) => input.then(String);', expected: 0 },
    { name: 'rejects AbortSignal runtime methods', from: 'app/queries/signal/signal.ts', code: 'export const signal = AbortSignal.timeout(10);', expected: 1 },
    { name: 'rejects environment imports in core', from: 'core/processes/files/files.ts', code: "import { readFile } from 'node:fs'; export { readFile };", expected: 1 },
    { name: 'accepts cancellation signals', from: 'app/ports/repos/readOptions/readOptions.ts', code: 'export type Value = { signal?: AbortSignal };', expected: 0 },
    { name: 'accepts domain properties named location', from: 'core/processes/browser/browser.ts', code: 'export const position = ({ location: "room" }).location;', expected: 0 },
    { name: 'accepts local names that shadow browser globals', from: 'core/processes/browser/browser.ts', code: 'export const shadowed = (location: string) => location;', expected: 0 },
    { name: 'rejects concrete repo reexports', from: 'ui/pages/home/index.ts', code: "export { Value } from '@/env/repos/user';", expected: 1 },
    { name: 'rejects dynamic concrete repo imports', from: 'ui/pages/home/model/home.ts', code: "export const value = import('@/env/repos/user');", expected: 1 },
];

const cases = [
    ...fixtures.map(([name, from, to, expected, typeOnly], index) => ({
        name,
        from,
        expected,
        code: `import ${typeOnly ? 'type ' : ''}{ Value as value${index} } from '${to}'; export ${typeOnly ? 'type ' : ''}{ value${index} };`,
    })),
    ...codeFixtures,
];

const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'entities-architecture-'));
const sourceRoot = path.join(fixtureRoot, 'entities/worktree/apps/client/src');
const clientRoot = process.cwd();
const oxlint = path.join(clientRoot, '../../node_modules/oxlint/bin/oxlint');
const configPath = path.join(
    clientRoot,
    `.architecture-fixture-${path.basename(fixtureRoot)}.config.ts`
);
const messages = new Map<string, unknown[]>();
const fixtureLocations: string[] = [];

beforeAll(() => {
    mkdirSync(sourceRoot, { recursive: true });

    writeFileSync(
        configPath,
        `
        import base from ${JSON.stringify(path.join(clientRoot, 'oxlint.config.ts'))};
        import architecture from ${JSON.stringify(path.join(clientRoot, 'architecture.config.ts'))};
        export default {
            ...base,
            rules: {
                ...base.rules,
                'fsd/frontend-architecture': ['error', {
                    ...architecture,
                    sourceRoot: ${JSON.stringify(sourceRoot)},
                    legacyImports: [{ from: 'ui/pages/bridge/model/bridge.ts', to: 'entities/User' }],
                }],
            },
        };
    `
    );

    const fileLines = new Map<string, number>();

    for (const { from, code } of cases) {
        const filename = path.join(sourceRoot, from);
        const line = (fileLines.get(filename) ?? 0) + 1;

        mkdirSync(path.dirname(filename), { recursive: true });
        appendFileSync(filename, `${code}\n`);
        fileLines.set(filename, line);
        fixtureLocations.push(`${filename}:${line}`);
    }

    let output: string;

    try {
        output = execFileSync(
            process.execPath,
            [oxlint, '--config', configPath, '--format', 'json', ...fileLines.keys()],
            { encoding: 'utf8' }
        );
    } catch (error) {
        output = (error as { stdout: string }).stdout;
    }

    if (!output.startsWith('{')) {
        throw new Error(output);
    }

    const diagnostics = JSON.parse(output).diagnostics as {
        filename: string;
        code: string;
        labels: { span: { line: number } }[];
    }[];

    for (const diagnostic of diagnostics) {
        if (!diagnostic.code) {
            throw new Error(JSON.stringify(diagnostic));
        }

        if (
            diagnostic.code?.includes('fsd(') &&
            (!diagnostic.code.includes('prefer-alias-import') ||
                diagnostic.filename.includes('/core/'))
        ) {
            const filename = `${path.resolve(clientRoot, diagnostic.filename)}:${diagnostic.labels[0].span.line}`;
            const previous = messages.get(filename) ?? [];

            previous.push(diagnostic);
            messages.set(filename, previous);
        }
    }
});

afterAll(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
    rmSync(configPath, { force: true });
});

describe('frontend architecture', () => {
    it.each(cases.map((fixture, index) => ({ ...fixture, index })))(
        '$name',
        ({ expected, index }) => {
            const ruleMessages = messages.get(fixtureLocations[index]) ?? [];

            expect(ruleMessages).toHaveLength(expected);
        }
    );
});
