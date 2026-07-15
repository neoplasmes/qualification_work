import { HttpError, NetworkError } from '@/env/transport/http';
import { datasetFixture } from '@/test/cacheFixtures';
import { createReadHarness, datasetCodec, deferred } from '@/test/readFixtures';
import { dehydrate } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';

it('rejects stale response after clear', async () => {
    const response = deferred<typeof datasetFixture>();
    const started = deferred<void>();
    const { runtime, query, store, queryClient } = createReadHarness(async () => {
        started.resolve();

        return response.promise;
    });
    const pending = runtime.read(query, undefined);
    const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await started.promise;
    await runtime.invalidator.clearAll();
    response.resolve(datasetFixture);
    await rejection;
    await Promise.resolve();
    expect(store.get(datasetFixture.ref)).toBeUndefined();
    expect(queryClient.getQueryData(['getDataset', undefined])).toBeUndefined();
    await runtime.dispose();
});

it('propagates cancellation without cancelling another subscriber', async () => {
    const response = deferred<typeof datasetFixture>();
    let sharedSignal: AbortSignal | undefined;
    const { runtime, query } = createReadHarness(async (_input, options) => {
        sharedSignal = options?.signal;

        return response.promise;
    });
    const controller = new AbortController();
    const first = runtime.read(query, undefined, { signal: controller.signal });
    const rejection = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const second = runtime.read(query, undefined);
    controller.abort();
    await rejection;
    expect(sharedSignal?.aborted).toBe(false);
    response.resolve(datasetFixture);
    expect(await second).toEqual(datasetFixture);
    await runtime.dispose();
});

it.each([
    [new NetworkError('offline'), 2],
    [new HttpError(503), 2],
    [new HttpError(400), 1],
    [new Error('schema'), 1],
])('retries only technical transient failures: %s', async (error, expected) => {
    let attempts = 0;
    const { runtime, query } = createReadHarness(async () => {
        attempts++;

        throw error;
    });
    await expect(runtime.read(query, undefined)).rejects.toBe(error);
    expect(attempts).toBe(expected);
    await runtime.dispose();
});

it('normalizes input before key construction and execution', async () => {
    const { runtime, queryClient } = createReadHarness();
    const received: unknown[] = [];
    const query = {
        name: 'paged',
        reads: () => [],
        execute: async (input: { offset?: number; limit?: number }) => {
            received.push(input);

            return input;
        },
    };
    runtime.registerRead(
        query,
        {
            async normalize(value) {
                return { tree: { kind: 'value', value }, refs: [] };
            },
            resolve(result) {
                if (result.tree.kind !== 'value') {
                    throw new Error('Invalid');
                }

                return result.tree.value as { offset?: number; limit?: number };
            },
        },
        {
            normalizeInput: input => ({
                offset: input.offset ?? 0,
                limit: input.limit ?? 200,
            }),
            staleTime: 30_000,
        }
    );
    await runtime.read(query, {});
    await runtime.read(query, { offset: 0, limit: 200 });
    expect(received).toEqual([{ offset: 0, limit: 200 }]);
    expect(
        queryClient
            .getQueryCache()
            .getAll()
            .map(query => query.queryKey)
    ).toEqual([['paged', { offset: 0, limit: 200 }]]);
    await runtime.dispose();
});

it('rejects a staged response cleared while codec awaits', async () => {
    const { runtime, query, store } = createReadHarness();
    const ready = deferred<void>();
    const resume = deferred<void>();
    const delayed = { ...query, name: 'delayed' };
    runtime.registerRead(delayed, {
        ...datasetCodec,
        async normalize(output, input, staging) {
            const result = await datasetCodec.normalize(output, input, staging);
            ready.resolve();
            await resume.promise;
            await staging.upsert(output.ref, { name: 'late' });

            return result;
        },
    });
    const pending = runtime.read(delayed, undefined);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await ready.promise;
    expect(store.get(datasetFixture.ref)).toBeUndefined();
    await runtime.invalidator.clearAll();
    resume.resolve();
    await rejected;
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(store.get(datasetFixture.ref)).toBeUndefined();
    await runtime.dispose();
});

it('invalidates exact declared dependencies without prefix matching', async () => {
    let calls = 0;
    const { runtime, query, queryClient } = createReadHarness(async () => {
        calls++;

        return datasetFixture;
    });
    await runtime.read(query, undefined);
    await runtime.invalidator.invalidate(['dataset']);
    expect(queryClient.getQueryState(['getDataset', undefined])?.isInvalidated).toBe(
        false
    );
    await runtime.invalidator.invalidate([datasetFixture.ref]);
    expect(queryClient.getQueryState(['getDataset', undefined])?.isInvalidated).toBe(
        true
    );
    expect(calls).toBe(1);
    await runtime.dispose();
});

it('cancels transport when its final loader leaves', async () => {
    const response = deferred<typeof datasetFixture>();
    let signal: AbortSignal | undefined;
    const { runtime, query } = createReadHarness(async (_input, options) => {
        signal = options?.signal;

        return response.promise;
    });
    const controller = new AbortController();
    const pending = runtime.read(query, undefined, { signal: controller.signal });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await rejected;
    expect(signal?.aborted).toBe(true);
    response.resolve(datasetFixture);
    await runtime.dispose();
});

it('does not restore tombstoned rows from a later response', async () => {
    const { runtime, query, store } = createReadHarness();
    runtime.tombstones.add(datasetFixture.ref);
    await expect(runtime.read(query, undefined)).rejects.toThrow();
    expect(store.get(datasetFixture.ref)).toBeUndefined();
    await runtime.dispose();
});

it('invalidates registered reads without dependencies on invalidateAll', async () => {
    const { runtime, queryClient } = createReadHarness();
    const query = {
        name: 'independent',
        execute: async () => datasetFixture,
        reads: () => [],
    };
    runtime.registerRead(query, datasetCodec);
    await runtime.read(query, undefined);
    await runtime.invalidator.invalidateAll();
    expect(queryClient.getQueryState(['independent', undefined])?.isInvalidated).toBe(
        true
    );
    await runtime.dispose();
});

it('honors cancellation while repairing an incomplete cached read', async () => {
    let calls = 0;
    const { runtime, query, store } = createReadHarness(async () => {
        calls++;

        return datasetFixture;
    });
    await runtime.read(query, undefined);
    await store.remove(datasetFixture.ref);
    const controller = new AbortController();
    const pending = runtime.read(query, undefined, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(calls).toBe(1);
    await runtime.dispose();
});

it('keeps normalized query cache serializable', async () => {
    const { runtime, query, queryClient } = createReadHarness();
    await runtime.read(query, undefined);
    expect(() => JSON.stringify(dehydrate(queryClient))).not.toThrow();
    await runtime.dispose();
});

it('does not restart collection timers after disposed reads settle', async () => {
    vi.useFakeTimers();
    const response = deferred<typeof datasetFixture>();
    const { runtime, query } = createReadHarness(async () => response.promise);
    try {
        const pending = runtime.read(query, undefined);
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        await runtime.dispose();
        await rejected;
        response.resolve(datasetFixture);
        await vi.advanceTimersByTimeAsync(0);
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        await runtime.dispose();
        vi.useRealTimers();
    }
});

it.each(['clear', 'abort', 'dispose'] as const)(
    'rejects fresh cached delivery after immediate %s',
    async mode => {
        const { runtime, query, store, queryClient } = createReadHarness();
        const fresh = { ...query, name: 'fresh' };
        runtime.registerRead(fresh, datasetCodec, { staleTime: 30_000 });
        await runtime.read(fresh, undefined);

        const controller = new AbortController();
        const pending = runtime.read(fresh, undefined, { signal: controller.signal });
        let clearing: Promise<void> | undefined;
        if (mode === 'abort') {
            controller.abort();
        } else {
            clearing = mode === 'clear' ? runtime.clear() : runtime.dispose();
        }

        try {
            await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
            await clearing;
            if (mode !== 'abort') {
                expect(store.get(datasetFixture.ref)).toBeUndefined();
                expect(queryClient.getQueryData(['fresh', undefined])).toBeUndefined();
            }
        } finally {
            await clearing;
            await runtime.dispose();
        }
    }
);

it('rejects the old epoch before fetching an incomplete cached read', async () => {
    let calls = 0;
    const { runtime, query, store, queryClient } = createReadHarness(async () => {
        calls++;

        return datasetFixture;
    });
    await runtime.read(query, undefined);
    await store.remove(datasetFixture.ref);

    const pending = runtime.read(query, undefined);
    const clearing = runtime.clear();
    try {
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        await clearing;
        expect(calls).toBe(1);
        expect(store.get(datasetFixture.ref)).toBeUndefined();
        expect(queryClient.getQueryData(['getDataset', undefined])).toBeUndefined();
    } finally {
        await clearing;
        await runtime.dispose();
    }
});
