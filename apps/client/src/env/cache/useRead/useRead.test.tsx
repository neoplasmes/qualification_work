import { datasetFixture } from '@/test/cacheFixtures';
import { createReadHarness } from '@/test/readFixtures';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { expect, it } from 'vitest';

import { CacheProvider } from '../context';
import { useRead } from './useRead';

it('updates mounted reads from canonical records', async () => {
    const { runtime, query, store } = createReadHarness();
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.data?.name).toBe('dataset'));
    await act(() => store.upsert(datasetFixture.ref, { name: 'changed' }));
    expect(hook.result.current.data?.name).toBe('changed');
    hook.unmount();
    await runtime.dispose();
});

it('refetches a missing record without exposing old data', async () => {
    let calls = 0;
    const { runtime, query, store } = createReadHarness(async () => {
        calls++;

        return { ...datasetFixture, name: `version-${calls}` };
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.data?.name).toBe('version-1'));
    await act(() => store.remove(datasetFixture.ref));
    await waitFor(() => expect(hook.result.current.data?.name).toBe('version-2'));
    hook.unmount();
    await runtime.dispose();
});

it('tracks replaced nested references', async () => {
    const { runtime, store } = createReadHarness();
    const parent = 'dashboard:org/dash' as const;
    const first = 'dashboardItem:org/dash/first' as const;
    const second = 'dashboardItem:org/dash/second' as const;
    const query = { name: 'nested', reads: () => [], execute: async () => ['first'] };
    runtime.registerRead(query, {
        async normalize(_output, _input, staging) {
            await staging.upsert(first, { id: 'first' });
            await staging.upsert(parent, { items: [first] });

            return { tree: { kind: 'ref', ref: parent }, refs: [parent] };
        },
        resolve(_result, staging) {
            const items = staging.get(parent)?.items;
            if (!items) {
                throw new Error('Missing items');
            }
            for (const ref of items) {
                if (!staging.get(ref)?.id) {
                    throw new Error('Missing item');
                }
            }

            return items.map(ref => staging.get(ref)!.id!);
        },
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.data).toEqual(['first']));
    await act(async () => {
        await store.upsert(second, { id: 'second' });
        await store.upsert(parent, { items: [second] });
    });
    expect(hook.result.current.data).toEqual(['second']);
    await act(() => store.upsert(second, { id: 'changed' }));
    expect(hook.result.current.data).toEqual(['changed']);
    hook.unmount();
    await runtime.dispose();
});

it('keeps a loader alive after the last hook unmounts', async () => {
    let signal: AbortSignal | undefined;
    let finish!: (value: typeof datasetFixture) => void;
    const response = new Promise<typeof datasetFixture>(resolve => {
        finish = resolve;
    });
    const { runtime, query } = createReadHarness(async (_input, options) => {
        signal = options?.signal;

        return response;
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    await waitFor(() => expect(signal).toBeDefined());
    const loader = runtime.read(query, undefined);
    hook.unmount();
    expect(signal?.aborted).toBe(false);
    finish(datasetFixture);
    expect(await loader).toEqual(datasetFixture);
    await runtime.dispose();
});

it('propagates active invalidation failures to the caller', async () => {
    let failed = false;
    const { runtime, query } = createReadHarness(async () => {
        if (failed) {
            throw new Error('refetch failed');
        }

        return datasetFixture;
    });
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.data).toEqual(datasetFixture));
    failed = true;
    await act(async () => {
        await expect(
            runtime.invalidator.invalidate([datasetFixture.ref])
        ).rejects.toThrow('refetch failed');
    });
    hook.unmount();
    await runtime.dispose();
});

it('does not render for unrelated record updates', async () => {
    let renders = 0;
    const { runtime, query, store } = createReadHarness();
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(
        () => {
            renders++;

            return useRead(query, undefined);
        },
        { wrapper: Wrapper }
    );
    await waitFor(() => expect(hook.result.current.isFetching).toBe(false));
    const before = renders;
    await act(() => store.upsert('dataset:org-1/unrelated', { name: 'other' }));
    expect(renders).toBe(before);
    hook.unmount();
    await runtime.dispose();
});

it('recovers mounted reads after clearing compositions', async () => {
    const { runtime, query } = createReadHarness();
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined), { wrapper: Wrapper });
    try {
        await waitFor(() => expect(hook.result.current.data).toEqual(datasetFixture));
        await act(() => runtime.invalidator.clearAll());
        await waitFor(() => expect(hook.result.current.data).toEqual(datasetFixture));
    } finally {
        hook.unmount();
        await runtime.dispose();
    }
});

it('distinguishes an opaque undefined value from a missing entity', async () => {
    const { runtime } = createReadHarness();
    const query = { name: 'optional', reads: () => [], execute: async () => undefined };
    runtime.registerRead(query, {
        async normalize(value) {
            return { tree: { kind: 'value', value }, refs: [] };
        },
        resolve() {
            return undefined;
        },
    });
    await runtime.read(query, undefined);
    function Wrapper({ children }: PropsWithChildren) {
        return <CacheProvider runtime={runtime}>{children}</CacheProvider>;
    }
    const hook = renderHook(() => useRead(query, undefined, { enabled: false }), {
        wrapper: Wrapper,
    });
    try {
        expect(hook.result.current.isPending).toBe(false);
    } finally {
        hook.unmount();
        await runtime.dispose();
    }
});
