import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CacheRuntime } from '@/env/cache/runtime';
import { createDependencies } from '@/main/dependencies';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';

const sourceRoot = path.resolve(import.meta.dirname, '../..');
const source = ts.createSourceFile(
    'entityRef.ts',
    readFileSync(path.join(sourceRoot, 'core/entities/entityRef/entityRef.ts'), 'utf8'),
    ts.ScriptTarget.Latest,
    true
);
const declaration = source.statements.find(
    node => ts.isTypeAliasDeclaration(node) && node.name.text === 'EntityName'
) as ts.TypeAliasDeclaration;
const families = new Set(
    (declaration.type as ts.UnionTypeNode).types.map(
        node => ((node as ts.LiteralTypeNode).literal as ts.StringLiteral).text
    )
);
// every read family currently has a direct invalidation producer
const readOnlyFamilies: string[] = [];
const input = {
    orgId: 'org/слэш',
    datasetId: 'data/слэш',
    chartId: 'chart/id',
    dashboardId: 'board/id',
    actionId: 'action/id',
    itemId: 'item/id',
};
const output = {
    id: 'new/id',
    datasetId: 'data/слэш',
    changes: [{ datasetId: 'data/слэш' }, { datasetId: 'second/data' }],
};
const fixtures: Record<string, Array<[unknown, unknown]>> = {
    addDashboardChart: [[input, output]],
    addDashboardMetric: [[input, output]],
    archiveAction: [[input, output]],
    cancelDatasetMerge: [[input, output]],
    commitDatasetMerge: [[input, output]],
    createAction: [[input, output]],
    createChart: [[input, output]],
    createDashboard: [[input, output]],
    createOrganization: [[input, output]],
    deleteChart: [[input, output]],
    deleteDashboard: [[input, output]],
    deleteDataset: [[input, output]],
    deleteDatasetRows: [[input, output]],
    deleteOrganization: [[input, output]],
    executeAction: [[input, output]],
    getAction: [[input, output]],
    getChart: [[input, output]],
    getChartData: [[input, output]],
    getDashboard: [[input, output]],
    getDatasetMetadata: [[input, output]],
    getDatasetRows: [[input, output]],
    getDatasetTableOptions: [[input, output]],
    getSession: [[input, output]],
    insertDatasetRow: [[input, output]],
    listActionRuns: [[input, output]],
    listActions: [[input, output]],
    listCharts: [[input, output]],
    listDashboards: [[input, output]],
    listDatasets: [[input, output]],
    login: [[input, output]],
    logout: [[input, output]],
    patchAction: [[input, output]],
    patchChart: [[input, output]],
    patchDataset: [[input, output]],
    patchDatasetColumn: [[input, output]],
    previewChartData: [[input, output]],
    previewDashboardMetric: [[input, output]],
    previewDatasetMerge: [[input, output]],
    register: [[input, output]],
    removeDashboardItem: [[input, output]],
    removeDatasetTableOptions: [[input, output]],
    renameDashboard: [[input, output]],
    saveDatasetTableOptions: [[input, output]],
    updateAction: [[input, output]],
    updateChart: [[input, output]],
    updateDashboardLayout: [[input, output]],
    updateDashboardMetric: [[input, output]],
    updateDatasetRows: [[input, output]],
    uploadDataset: [[input, output]],
};
fixtures.patchChart = [
    [input, output],
    [{ ...input, config: {} }, output],
    [{ ...input, chartType: 'bar' }, output],
];
fixtures.executeAction.push([input, { changes: [] }]);

it('covers every wired operation and registration without executing I/O', async () => {
    const fetch = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('Vocabulary must not execute HTTP'));
    const reads = vi.spyOn(CacheRuntime.prototype, 'registerRead');
    const writes = vi.spyOn(CacheRuntime.prototype, 'registerCommand');
    const runtime = createDependencies({ platform: 'server', apiBaseUrl: '/api' });
    try {
        const operations = runtime.operations;
        expect(Object.keys(fixtures).sort()).toEqual(Object.keys(operations).sort());
        const registered = [...reads.mock.calls, ...writes.mock.calls].map(
            call => call[0]
        );
        expect(registered).toHaveLength(Object.keys(operations).length);
        expect(new Set(registered)).toEqual(new Set(Object.values(operations)));
        const seen = new Set<string>();
        const readFamilies = new Set<string>();
        const writtenFamilies = new Set<string>();
        for (const [name, operation] of Object.entries(operations)) {
            const read = 'reads' in operation;
            const refsFor = (read ? operation.reads : operation.writes) as (
                input: unknown,
                output: unknown
            ) => readonly string[];
            for (const [fixtureInput, fixtureOutput] of fixtures[name]!) {
                const refs = refsFor(fixtureInput, fixtureOutput);
                expect(Array.isArray(refs), name).toBe(true);
                for (const ref of refs) {
                    const family = ref.split(':')[0]!;
                    expect(families.has(family), `${name}: unknown ${ref}`).toBe(true);
                    expect(ref, name).not.toMatch(/undefined|\[object Object\]/);
                    if (
                        ref.includes(':') &&
                        !['user', 'organization', 'datasetTableOptions'].includes(family)
                    ) {
                        expect(ref, `${name}: encoded organization`).toContain(
                            `${family}:${encodeURIComponent(input.orgId)}/`
                        );
                    }
                    seen.add(family);
                    (read ? readFamilies : writtenFamilies).add(family);
                }
            }
        }
        expect(
            [...families].filter(name => !seen.has(name)),
            'unused EntityName'
        ).toEqual([]);
        expect(
            [...readFamilies].filter(name => !writtenFamilies.has(name)),
            'unproduced read family'
        ).toEqual(readOnlyFamilies);
        expect(fetch).not.toHaveBeenCalled();
    } finally {
        await runtime.dispose();
        fetch.mockRestore();
        reads.mockRestore();
        writes.mockRestore();
    }
});

it('checks dependency literals and template prefixes including casts and helper producers', () => {
    const operationFiles = ['app/queries', 'app/commands'].flatMap(folder =>
        readdirSync(path.join(sourceRoot, folder), { recursive: true })
            .filter(name => /\.(?:query|command)\.ts$/.test(name.toString()))
            .map(name => path.join(folder, name.toString()))
    );
    expect(
        operationFiles.map(filename => path.basename(filename).split('.')[0]).sort()
    ).toEqual(Object.keys(fixtures).sort());
    const failures: string[] = [];
    for (const filename of [
        ...operationFiles,
        'core/processes/datasetChanges/datasetChanges.ts',
    ]) {
        const file = ts.createSourceFile(
            filename,
            readFileSync(path.join(sourceRoot, filename), 'utf8'),
            ts.ScriptTarget.Latest,
            true
        );
        const scan = (node: ts.Node, dependency = false) => {
            if (
                ts.isPropertyAssignment(node) &&
                ['reads', 'writes'].includes(node.name.getText(file))
            ) {
                scan(node.initializer, true);

                return;
            }
            if (dependency || filename.includes('datasetChanges')) {
                if (
                    ts.isStringLiteral(node) &&
                    (ts.isArrayLiteralExpression(node.parent) ||
                        ts.isAsExpression(node.parent) ||
                        (ts.isCallExpression(node.parent) &&
                            ts.isPropertyAccessExpression(node.parent.expression) &&
                            node.parent.expression.name.text === 'push'))
                ) {
                    if (!families.has(node.text.split(':')[0]!)) {
                        failures.push(`${filename}: ${node.text}`);
                    }
                }
                if (ts.isTemplateExpression(node)) {
                    const prefix = node.head.text.split(':')[0]!;
                    if (!node.head.text.includes(':') || !families.has(prefix)) {
                        failures.push(
                            `${filename}: unresolved template ${node.getText(file)}`
                        );
                    }
                }
            }
            ts.forEachChild(node, child => scan(child, dependency));
        };
        scan(file);
    }
    expect(failures).toEqual([]);
});
