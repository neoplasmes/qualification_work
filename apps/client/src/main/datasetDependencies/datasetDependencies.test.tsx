import { createDatasetDependencies } from '.';
import { datasetChanges } from '@/core/processes/datasetChanges';
import { CacheProvider } from '@/env/cache/context';
import { CacheRuntime } from '@/env/cache/runtime';
import { useRead } from '@/env/cache/useRead';
import { HttpTransport } from '@/env/transport/http';
import { createCacheHarness, datasetFixture, rowFixture } from '@/test/cacheFixtures';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';

const scope = { orgId: 'org-1', datasetId: 'dataset-1' };
const column = {
    id: 'col-1',
    datasetId: 'dataset-1',
    key: 'value',
    displayName: 'Value',
    dataType: 'number' as const,
    orderIndex: 0,
    isAnalyzable: true,
};
const metadata = { dataset: datasetFixture, columns: [column], totalRows: 1 };

it('shares two mounted metadata reads and updates both from a confirmed column', async () => {
    const harness = createCacheHarness();
    const runtime = new CacheRuntime(harness.queryClient, harness.store);
    let changed = false;
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (_url, init) => {
            if (init?.method === 'PATCH') {
                changed = true;

                return Response.json({ ...column, isAnalyzable: false });
            }

            return Response.json({
                ...metadata,
                columns: [{ ...column, isAnalyzable: !changed }],
            });
        });
    const operations = createDatasetDependencies(
        runtime,
        new HttpTransport({ baseUrl: '/api', fetch })
    );
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const first = renderHook(() => useRead(operations.getDatasetMetadata, scope), {
        wrapper: Wrapper,
    });
    const second = renderHook(() => useRead(operations.getDatasetMetadata, scope), {
        wrapper: Wrapper,
    });
    await waitFor(() =>
        expect(first.result.current.data?.columns[0]?.isAnalyzable).toBe(true)
    );
    expect(second.result.current.data?.columns[0]).toBe(
        first.result.current.data?.columns[0]
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
        await harness.store.upsert('datasetColumn:org-1/dataset-1/col-1', {
            isAnalyzable: false,
        });
    });
    expect(first.result.current.data?.columns[0]?.isAnalyzable).toBe(false);
    expect(second.result.current.data?.columns[0]?.isAnalyzable).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
        await runtime.execute(operations.patchDatasetColumn, {
            ...scope,
            columnId: 'col-1',
            isAnalyzable: false,
        });
    });
    expect(first.result.current.data?.columns[0]?.isAnalyzable).toBe(false);
    expect(second.result.current.data?.columns[0]).toBe(
        first.result.current.data?.columns[0]
    );
    expect(
        JSON.stringify(harness.queryClient.getQueryData(['getDatasetMetadata', scope]))
    ).not.toContain('displayName');
    first.unmount();
    second.unmount();
    await runtime.dispose();
});

it('normalizes paging before keys and removes returned deleted rows without upserting them', async () => {
    const harness = createCacheHarness();
    const runtime = new CacheRuntime(harness.queryClient, harness.store);
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (_url, init) => {
            if (init?.method === 'DELETE') {
                return Response.json([rowFixture]);
            }

            return Response.json({
                rows: [rowFixture],
                totalRows: 1,
                offset: 0,
                limit: 200,
            });
        });
    const operations = createDatasetDependencies(
        runtime,
        new HttpTransport({ baseUrl: '/api', fetch })
    );
    await runtime.read(operations.getDatasetRows, scope);
    expect(
        harness.queryClient.getQueryData([
            'getDatasetRows',
            { ...scope, offset: 0, limit: 200 },
        ])
    ).toBeDefined();
    await runtime.execute(operations.deleteDatasetRows, { ...scope, rowIds: ['row-1'] });
    expect(harness.store.get(rowFixture.ref)).toBeUndefined();
    expect(runtime.tombstones.has(rowFixture.ref)).toBe(true);
    await runtime.dispose();
});

it('removes owned children and tombstones a dataset even if its body was never loaded', async () => {
    const harness = createCacheHarness();
    const runtime = new CacheRuntime(harness.queryClient, harness.store);
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
    const operations = createDatasetDependencies(
        runtime,
        new HttpTransport({ baseUrl: '/api', fetch })
    );
    await harness.store.upsert(rowFixture.ref, rowFixture);
    await harness.store.upsert('datasetColumn:org-1/dataset-1/col-1', {
        ...column,
        ref: 'datasetColumn:org-1/dataset-1/col-1',
    });
    await harness.store.upsert('dataset:other/dataset-1', {
        ...datasetFixture,
        ref: 'dataset:other/dataset-1',
        orgId: 'other',
    });
    await runtime.execute(operations.deleteDataset, scope);
    expect(harness.store.get(rowFixture.ref)).toBeUndefined();
    expect(harness.store.get('datasetColumn:org-1/dataset-1/col-1')).toBeUndefined();
    expect(runtime.tombstones.has(datasetFixture.ref)).toBe(true);
    expect(harness.store.get('dataset:other/dataset-1')).toBeDefined();
    await runtime.dispose();
});

it('keeps operation vocabulary stable and separate for each runtime', async () => {
    const first = createCacheHarness();
    const second = createCacheHarness();
    const runtime = new CacheRuntime(first.queryClient, first.store);
    const otherRuntime = new CacheRuntime(second.queryClient, second.store);
    const transport = new HttpTransport({ baseUrl: '/api', fetch: vi.fn() });
    const operations = createDatasetDependencies(runtime, transport);
    const otherOperations = createDatasetDependencies(otherRuntime, transport);
    expect(operations.listDatasets).not.toBe(otherOperations.listDatasets);
    expect(operations.listDatasets.name).toBe('listDatasets');
    expect(operations.getDatasetMetadata.name).toBe('getDatasetMetadata');
    expect(operations.getDatasetRows.name).toBe('getDatasetRows');
    expect(operations.listDatasets.reads(scope)).toEqual(['dataset', 'datasetColumn']);
    expect(operations.getDatasetMetadata.reads(scope)).toEqual([
        datasetFixture.ref,
        'datasetColumn',
        'datasetRow',
    ]);
    expect(operations.getDatasetRows.reads(scope)).toEqual([
        datasetFixture.ref,
        'datasetRow',
        'datasetColumn',
    ]);
    expect(operations.patchDataset.writes({ ...scope, name: 'new' }, undefined)).toEqual(
        datasetChanges(datasetFixture.ref, 'metadata')
    );
    expect(operations.deleteDataset.writes(scope, undefined)).toEqual(
        datasetChanges(datasetFixture.ref, 'removed')
    );
    const content = datasetChanges(datasetFixture.ref, 'content');
    expect(
        operations.patchDatasetColumn.writes(
            { ...scope, columnId: column.id, isAnalyzable: false },
            { ...column, ref: 'datasetColumn:org-1/dataset-1/col-1' }
        )
    ).toEqual(content);
    expect(
        operations.updateDatasetRows.writes(
            { ...scope, rowIds: [rowFixture.id], values: {} },
            [rowFixture]
        )
    ).toEqual(content);
    expect(
        operations.insertDatasetRow.writes({ ...scope, data: {} }, rowFixture)
    ).toEqual(content);
    expect(
        operations.deleteDatasetRows.writes({ ...scope, rowIds: [rowFixture.id] }, [
            rowFixture,
        ])
    ).toEqual(content);
    await runtime.dispose();
    await otherRuntime.dispose();
});
