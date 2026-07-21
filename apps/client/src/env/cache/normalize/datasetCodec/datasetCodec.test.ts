import { datasetListCodec, datasetMetadataCodec, datasetRowsCodec } from '.';
import { CacheRuntime } from '@/env/cache/runtime';
import { createCacheHarness, datasetFixture, rowFixture } from '@/test/cacheFixtures';
import { expect, it } from 'vitest';

import type {
    DatasetMetadata,
    DatasetRowsPage,
    DatasetScope,
} from '@/app/ports/repos/dataset';
import type { Query } from '@/app/queries/query';

it('shares clean list/detail entities while keeping rows and opaque JSON separate', async () => {
    const harness = createCacheHarness();
    const runtime = new CacheRuntime(harness.queryClient, harness.store);
    const input = { orgId: 'org-1', datasetId: 'dataset-1' };
    const output: DatasetMetadata = {
        dataset: datasetFixture,
        columns: [
            {
                ref: 'datasetColumn:org-1/dataset-1/col-1',
                id: 'col-1',
                datasetId: 'dataset-1',
                key: 'value',
                displayName: 'Value',
                dataType: 'number',
                orderIndex: 0,
                isAnalyzable: true,
            },
        ],
        totalRows: 1,
    };
    const detail: Query<DatasetScope, DatasetMetadata> = {
        name: 'detail',
        reads: () => [datasetFixture.ref],
        execute: async () => output,
    };
    const list: Query<DatasetScope, DatasetMetadata[]> = {
        name: 'list',
        reads: () => ['dataset'],
        execute: async () => [output],
    };
    const rows: Query<DatasetScope, DatasetRowsPage> = {
        name: 'rows',
        reads: () => ['datasetRow'],
        execute: async () => ({
            rows: [
                {
                    ...rowFixture,
                    data: { nested: { id: 'x', ref: 'dataset:fake', $synced: false } },
                },
            ],
            totalRows: 1,
            offset: 0,
            limit: 200,
        }),
    };
    runtime.registerRead(detail, datasetMetadataCodec);
    runtime.registerRead(list, datasetListCodec);
    runtime.registerRead(rows, datasetRowsCodec);
    const a = await runtime.read(detail, input);
    const b = await runtime.read(list, input);
    expect(a.dataset).toBe(b[0]?.dataset);
    expect(a.columns[0]).toBe(b[0]?.columns[0]);
    expect(Object.keys(a.dataset).some(key => key.startsWith('$'))).toBe(false);
    await harness.store.upsert(output.columns[0]!.ref, { isAnalyzable: false });
    expect(
        datasetMetadataCodec.resolve(
            harness.queryClient.getQueryData(['detail', input])!,
            runtime.projections
        ).columns[0]?.isAnalyzable
    ).toBe(false);
    const page = await runtime.read(rows, input);
    expect(page.rows[0]?.data).toEqual({
        nested: { id: 'x', ref: 'dataset:fake', $synced: false },
    });
    expect(
        JSON.stringify(harness.queryClient.getQueryData(['detail', input]))
    ).not.toContain('displayName');
    expect(
        JSON.stringify(harness.queryClient.getQueryData(['rows', input]))
    ).not.toContain('nested');
    expect([...harness.store.keys()]).toHaveLength(3);
    await runtime.dispose();
});
