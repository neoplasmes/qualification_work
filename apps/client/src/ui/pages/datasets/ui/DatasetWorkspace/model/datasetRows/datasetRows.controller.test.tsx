import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';

import { useDatasetRowsController } from './datasetRows.controller';

it('loads inclusive ranges in deduplicated 200 row chunks without storing row bodies', async () => {
    const store = createUiTestRuntime();
    const read = vi
        .spyOn(store.runtime.dependencies.getDatasetRows, 'execute')
        .mockImplementation(async input => ({
            offset: input.offset ?? 0,
            limit: input.limit ?? 200,
            totalRows: 500,
            rows: Array.from({ length: 200 }, (_, i) => ({
                ref: `datasetRow:org/dataset/${(input.offset ?? 0) + i}` as const,
                id: String((input.offset ?? 0) + i),
                datasetId: 'dataset',
                rowIndex: (input.offset ?? 0) + i,
                data: { value: i },
            })),
        }));
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(
        () => useDatasetRowsController({ orgId: 'org', datasetId: 'dataset' }),
        { wrapper: Wrapper }
    );
    await act(async () => {
        await result.current.ensureRange(0, 399);
    });
    await waitFor(() => expect(result.current.getRow(399)?.id).toBe('399'));
    await act(async () => {
        await result.current.ensureRange(0, 399);
    });
    expect(read.mock.calls.map(([input]) => [input.offset, input.limit]).sort()).toEqual([
        [0, 200],
        [200, 200],
    ]);
    expect(result.current.getRow(400)).toBeUndefined();
    const rowObjectsOutsideLoadedChunks = [...store.runtime.cache.store.keys()]
        .filter(ref => ref.startsWith('datasetRow:'))
        .filter(ref => Number(ref.split('/').at(-1)) >= 400);
    expect(rowObjectsOutsideLoadedChunks).toHaveLength(0);
    expect(result.current.totalRows).toBe(500);
});

it('distinguishes a resolved empty page from loading', async () => {
    const store = createUiTestRuntime();
    store.runtime.dependencies.getDatasetRows.execute = async () => ({
        rows: [],
        totalRows: 0,
        offset: 0,
        limit: 200,
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(
        () => useDatasetRowsController({ orgId: 'org', datasetId: 'empty' }),
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalRows).toBe(0);
    expect(result.current.error).toBeUndefined();
});

it('removes rows without showing dangling refs and refetches shifted chunk boundaries', async () => {
    const store = createUiTestRuntime();
    let ids = Array.from({ length: 401 }, (_, i) => String(i));
    store.runtime.dependencies.getDatasetRows.execute = async input => ({
        rows: ids.slice(input.offset, (input.offset ?? 0) + 200).map((id, i) => ({
            ref: `datasetRow:org/dataset/${id}` as const,
            id,
            datasetId: 'dataset',
            rowIndex: (input.offset ?? 0) + i,
            data: { value: id },
        })),
        totalRows: ids.length,
        offset: input.offset ?? 0,
        limit: 200,
    });
    store.runtime.dependencies.deleteDatasetRows.execute = async () => {
        ids = ids.filter(id => id !== '199');

        return [
            {
                ref: 'datasetRow:org/dataset/199',
                id: '199',
                datasetId: 'dataset',
                rowIndex: 199,
                data: { value: '199' },
            },
        ];
    };
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(
        () => useDatasetRowsController({ orgId: 'org', datasetId: 'dataset' }),
        { wrapper: Wrapper }
    );
    await act(async () => {
        await result.current.ensureRange(0, 399);
    });
    await waitFor(() => expect(result.current.getRow(199)?.id).toBe('199'));
    await act(async () => {
        await store.runtime.cache.execute(store.runtime.dependencies.deleteDatasetRows, {
            orgId: 'org',
            datasetId: 'dataset',
            rowIds: ['199'],
        });
    });
    await waitFor(() => expect(result.current.getRow(199)?.id).toBe('200'));
    expect(result.current.getRow(200)?.id).toBe('201');
    expect(result.current.totalRows).toBe(400);
    expect(store.runtime.cache.store.get('datasetRow:org/dataset/199')).toBeUndefined();
});

it('ignores an old dataset completion after scope changes', async () => {
    const store = createUiTestRuntime();
    let finish!: () => void;
    store.runtime.dependencies.getDatasetRows.execute = input =>
        new Promise(resolve => {
            const complete = () =>
                resolve({
                    rows: [
                        {
                            ref: `datasetRow:${input.orgId}/${input.datasetId}/row`,
                            id: 'row',
                            datasetId: input.datasetId,
                            rowIndex: 0,
                            data: { scope: input.orgId },
                        },
                    ],
                    totalRows: 1,
                    offset: 0,
                    limit: 200,
                });
            if (input.orgId === 'old') {
                finish = complete;
            } else {
                complete();
            }
        });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result, rerender } = renderHook(
        ({ orgId }) => useDatasetRowsController({ orgId, datasetId: 'dataset' }),
        { wrapper: Wrapper, initialProps: { orgId: 'old' } }
    );
    await waitFor(() => expect(finish).toBeDefined());
    rerender({ orgId: 'new' });
    await waitFor(() => expect(result.current.getRow(0)?.data.scope).toBe('new'));
    await act(async () => {
        finish();
    });
    expect(result.current.getRow(0)?.data.scope).toBe('new');
});

it('exposes read failures and retries only the requested range', async () => {
    const store = createUiTestRuntime();
    const read = vi
        .spyOn(store.runtime.dependencies.getDatasetRows, 'execute')
        .mockRejectedValueOnce(new Error('Offline'))
        .mockResolvedValue({ rows: [], totalRows: 0, offset: 0, limit: 200 });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(
        () => useDatasetRowsController({ orgId: 'org', datasetId: 'dataset' }),
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.error).toBeTruthy());
    await act(async () => {
        await result.current.ensureRange(0, 0);
    });
    await waitFor(() => expect(result.current.error).toBeUndefined());
    expect(read).toHaveBeenCalledTimes(2);
});
