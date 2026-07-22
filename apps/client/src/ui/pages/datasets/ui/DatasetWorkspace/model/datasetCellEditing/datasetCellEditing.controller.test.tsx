import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { useDatasetCellEditing } from './datasetCellEditing.controller';

const metadata: DatasetMetadata = {
    dataset: {
        ref: 'dataset:org/ds',
        id: 'ds',
        orgId: 'org',
        name: 'Data',
        sourceType: 'manual',
        createdAt: '',
        updatedAt: '',
    },
    columns: [
        {
            ref: 'datasetColumn:org/ds/a',
            id: 'a',
            datasetId: 'ds',
            key: 'amount',
            displayName: 'Amount',
            dataType: 'number',
            orderIndex: 0,
            isAnalyzable: true,
        },
    ],
    totalRows: 1,
};
afterEach(() => vi.useRealTimers());

it('edits a cell without losing a newer draft', async () => {
    vi.useFakeTimers();
    const store = createUiTestRuntime();
    let confirm!: () => void;
    store.runtime.dependencies.updateDatasetRows.execute = input =>
        new Promise(resolve => {
            confirm = () =>
                resolve([
                    {
                        ref: 'datasetRow:org/ds/row',
                        id: 'row',
                        datasetId: 'ds',
                        rowIndex: 0,
                        data: input.values,
                    },
                ]);
        });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(() => useDatasetCellEditing(metadata, false), {
        wrapper: Wrapper,
    });
    act(() => result.current.commitCell('row', metadata.columns[0]!, '10'));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
    });
    act(() => result.current.commitCell('row', metadata.columns[0]!, '20'));
    await act(async () => {
        confirm();
        await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.displayEdits.get('row')?.amount).toBe(20);
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
        confirm();
        await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.displayEdits.has('row')).toBe(false);
});

it('keeps a clear visible until a complete missing-key acknowledgement', async () => {
    vi.useFakeTimers();
    const store = createUiTestRuntime();
    let confirm!: () => void;
    store.runtime.dependencies.updateDatasetRows.execute = () =>
        new Promise(resolve => {
            confirm = () =>
                resolve([
                    {
                        ref: 'datasetRow:org/ds/row',
                        id: 'row',
                        datasetId: 'ds',
                        rowIndex: 0,
                        data: {},
                    },
                ]);
        });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(() => useDatasetCellEditing(metadata, false), {
        wrapper: Wrapper,
    });
    act(() => result.current.commitCell('row', metadata.columns[0]!, ''));
    expect(result.current.displayEdits.get('row')).toEqual({ amount: null });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
    });
    expect(result.current.displayEdits.get('row')).toEqual({ amount: null });
    await act(async () => {
        confirm();
        await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.displayEdits.has('row')).toBe(false);
    expect(store.runtime.cache.store.get('datasetRow:org/ds/row')?.data).toEqual({});
});

it('retains failed input and groups fields only within the same row', async () => {
    vi.useFakeTimers();
    const store = createUiTestRuntime();
    const write = vi
        .spyOn(store.runtime.dependencies.updateDatasetRows, 'execute')
        .mockRejectedValue(new Error('Cannot save'));
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(() => useDatasetCellEditing(metadata, false), {
        wrapper: Wrapper,
    });
    act(() => {
        result.current.commitCell('row', metadata.columns[0]!, '12');
        result.current.commitCell('row', { ...metadata.columns[0]!, key: 'other' }, '13');
        result.current.commitCell('second', metadata.columns[0]!, '14');
    });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
    });
    expect(write.mock.calls.map(([input]) => [input.rowIds, input.values])).toEqual([
        [['row'], { amount: 12, other: 13 }],
        [['second'], { amount: 14 }],
    ]);
    expect(result.current.displayEdits.get('row')).toEqual({ amount: 12, other: 13 });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.error).toBeTruthy();
});

it('reports a refresh failure separately after a confirmed write without resending it', async () => {
    vi.useFakeTimers();
    const store = createUiTestRuntime();
    const failure = new Error('Refresh failed');
    vi.spyOn(store.runtime.cache.invalidator, 'invalidate').mockRejectedValue(failure);
    const write = vi
        .spyOn(store.runtime.dependencies.updateDatasetRows, 'execute')
        .mockResolvedValue([
            {
                ref: 'datasetRow:org/ds/row',
                id: 'row',
                datasetId: 'ds',
                rowIndex: 0,
                data: { amount: 10 },
            },
        ]);
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(() => useDatasetCellEditing(metadata, false), {
        wrapper: Wrapper,
    });
    act(() => result.current.commitCell('row', metadata.columns[0]!, '10'));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(710);
    });
    expect(result.current.displayEdits.has('row')).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.syncError).toBe(failure);
    await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
    });
    expect(write).toHaveBeenCalledTimes(1);
});
