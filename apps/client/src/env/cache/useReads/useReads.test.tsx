import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';

import { useReads } from './useReads';

it('keeps ordered projections and releases observers when inputs leave', async () => {
    const store = createUiTestRuntime();
    store.runtime.dependencies.getDatasetRows.execute = async input => ({
        rows: [
            {
                ref: `datasetRow:org/ds/${input.offset}` as const,
                id: String(input.offset),
                datasetId: 'ds',
                rowIndex: input.offset!,
                data: { amount: 10 },
            },
        ],
        totalRows: 401,
        offset: input.offset!,
        limit: 200,
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result, rerender, unmount } = renderHook(
        ({ offsets }) =>
            useReads(
                store.runtime.dependencies.getDatasetRows,
                offsets.map(offset => ({
                    orgId: 'org',
                    datasetId: 'ds',
                    offset,
                    limit: 200,
                }))
            ),
        { wrapper: Wrapper, initialProps: { offsets: [0, 200] } }
    );
    await waitFor(() => expect(result.current[1]?.data?.rows[0]?.id).toBe('200'));
    const first = result.current[0]!.data!.rows[0];
    rerender({ offsets: [200, 0] });
    expect(result.current[1]!.data!.rows[0]).toBe(first);
    await act(async () => {
        await store.runtime.cache.store.upsert('datasetRow:org/ds/0', {
            data: { amount: 20 },
        });
    });
    expect(result.current[1]!.data!.rows[0]!.data.amount).toBe(20);
    rerender({ offsets: [200] });
    expect(
        store.runtime.cache.queryClient
            .getQueryCache()
            .find({
                queryKey: [
                    'getDatasetRows',
                    { orgId: 'org', datasetId: 'ds', offset: 0, limit: 200 },
                ],
            })
            ?.getObserversCount()
    ).toBe(0);
    unmount();
    expect(
        store.runtime.cache.queryClient
            .getQueryCache()
            .getAll()
            .every(query => query.getObserversCount() === 0)
    ).toBe(true);
});

it('invalidates chart and metric reads after update', async () => {
    const store = createUiTestRuntime();
    const chart = {
        name: 'chartProbe',
        execute: vi.fn(async () => 1),
        reads: () => ['chartData' as const],
    };
    const metric = {
        name: 'metricProbe',
        execute: vi.fn(async () => 1),
        reads: () => ['metricPreview' as const],
    };
    const { valueCodec } = await import('../normalize');
    store.runtime.cache.registerRead(chart, valueCodec());
    store.runtime.cache.registerRead(metric, valueCodec());
    store.runtime.dependencies.updateDatasetRows.execute = async () => [];
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(
        () => ({
            chart: useReads(chart, [undefined]),
            metric: useReads(metric, [undefined]),
        }),
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.metric[0]?.data).toBe(1));
    await act(async () => {
        await store.runtime.cache.execute(store.runtime.dependencies.updateDatasetRows, {
            orgId: 'org',
            datasetId: 'ds',
            rowIds: ['row'],
            values: { amount: 20 },
        });
    });
    expect(chart.execute).toHaveBeenCalledTimes(2);
    expect(metric.execute).toHaveBeenCalledTimes(2);
});
