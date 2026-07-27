import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import type { PropsWithChildren } from 'react';

import 'fake-indexeddb/auto';

import { IdbDatasetTableOptionsRepo } from '@/env/repos/datasetTableOptions';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDatasetTableOptions } from './tableOptions.controller';

describe('useDatasetTableOptions', () => {
    it('hydrates widths from storage on mount', async () => {
        await new IdbDatasetTableOptionsRepo().set('ds-hydrate', {
            columnWidths: { a: 111 },
        });

        const store = createUiTestRuntime({}, true);
        function Wrapper({ children }: PropsWithChildren) {
            return <UiTestProvider store={store}>{children}</UiTestProvider>;
        }
        const { result } = renderHook(() => useDatasetTableOptions('ds-hydrate'), {
            wrapper: Wrapper,
        });

        expect(result.current.isHydrated).toBe(false);

        await waitFor(() => expect(result.current.widths).toEqual({ a: 111 }));
        expect(result.current.isHydrated).toBe(true);
    });

    it('updates widths immediately and persists them', async () => {
        const store = createUiTestRuntime({}, true);
        function Wrapper({ children }: PropsWithChildren) {
            return <UiTestProvider store={store}>{children}</UiTestProvider>;
        }
        const { result } = renderHook(() => useDatasetTableOptions('ds-save'), {
            wrapper: Wrapper,
        });

        act(() => result.current.setColumnWidth('a', 222));

        expect(result.current.widths).toEqual({ a: 222 });

        await waitFor(async () => {
            const stored = await new IdbDatasetTableOptionsRepo().get('ds-save');
            expect(stored?.columnWidths).toEqual({ a: 222 });
        });
    });
});

it('ignores late hydration from a previous dataset', async () => {
    const store = createUiTestRuntime();
    let finish!: () => void;
    store.runtime.dependencies.getDatasetTableOptions.execute = input =>
        input.datasetId === 'old'
            ? new Promise(resolve => {
                  finish = () => resolve({ amount: 100 });
              })
            : Promise.resolve({ amount: 222 });
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result, rerender } = renderHook(
        ({ datasetId }) => useDatasetTableOptions(datasetId),
        { wrapper: Wrapper, initialProps: { datasetId: 'old' } }
    );
    await waitFor(() => expect(finish).toBeDefined());
    rerender({ datasetId: 'new' });
    expect(result.current.isHydrated).toBe(false);
    await waitFor(() => expect(result.current.widths).toEqual({ amount: 222 }));
    await act(async () => {
        finish();
    });
    expect(result.current.widths).toEqual({ amount: 222 });
});

it('keeps the latest resize immediate and writes once after 150ms', async () => {
    const store = createUiTestRuntime({}, true);
    const write = vi
        .spyOn(store.runtime.dependencies.saveDatasetTableOptions, 'execute')
        .mockResolvedValue();
    store.runtime.dependencies.getDatasetTableOptions.execute = async () => ({});
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(() => useDatasetTableOptions('timed'), {
        wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    vi.useFakeTimers();
    try {
        act(() => {
            result.current.setColumnWidth('amount', 180);
            result.current.setColumnWidth('amount', 240);
        });
        expect(result.current.widths).toEqual({ amount: 240 });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(149);
        });
        expect(write).not.toHaveBeenCalled();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });
        expect(write).toHaveBeenCalledExactlyOnceWith({
            datasetId: 'timed',
            widths: { amount: 240 },
        });
    } finally {
        vi.useRealTimers();
    }
});

it('reports storage hydration failure while keeping usable widths', async () => {
    const store = createUiTestRuntime({}, true);
    const failure = new Error('Storage unavailable');
    store.runtime.dependencies.getDatasetTableOptions.execute = async () => {
        throw failure;
    };
    function Wrapper({ children }: PropsWithChildren) {
        return <UiTestProvider store={store}>{children}</UiTestProvider>;
    }
    const { result } = renderHook(() => useDatasetTableOptions('unavailable'), {
        wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.error).toBe(failure);
    act(() => result.current.setColumnWidth('amount', 240));
    expect(result.current.widths).toEqual({ amount: 240 });
});
