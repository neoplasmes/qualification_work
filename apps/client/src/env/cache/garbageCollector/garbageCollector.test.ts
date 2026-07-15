import { datasetFixture } from '@/test/cacheFixtures';
import { createReadHarness, datasetCodec } from '@/test/readFixtures';
import { expect, it, vi } from 'vitest';

it('keeps entities referenced by another query', async () => {
    vi.useFakeTimers();
    const { runtime, query, store, queryClient } = createReadHarness();
    try {
        const other = { ...query, name: 'other' };
        runtime.registerRead(other, datasetCodec);
        await runtime.read(query, undefined);
        await runtime.read(other, undefined);
        queryClient.removeQueries({ queryKey: ['getDataset'] });
        await vi.advanceTimersByTimeAsync(30_000);
        expect(store.get(datasetFixture.ref)).toBeDefined();
        queryClient.removeQueries({ queryKey: ['other'] });
        await vi.advanceTimersByTimeAsync(29_999);
        expect(store.get(datasetFixture.ref)).toBeDefined();
        await vi.advanceTimersByTimeAsync(1);
        expect(store.get(datasetFixture.ref)).toBeUndefined();
    } finally {
        await runtime.dispose();
        vi.useRealTimers();
    }
});

it('retains in-flight normalization leases through publication', async () => {
    vi.useFakeTimers();
    const { runtime, query, store, queryClient } = createReadHarness();
    let resume!: () => void;
    let started!: () => void;
    const ready = new Promise<void>(resolve => {
        started = resolve;
    });
    const continuation = new Promise<void>(resolve => {
        resume = resolve;
    });
    const delayed = { ...query, name: 'delayed' };
    runtime.registerRead(delayed, {
        ...datasetCodec,
        async normalize(output, input, staging) {
            const result = await datasetCodec.normalize(output, input, staging);
            started();
            await continuation;

            return result;
        },
    });
    try {
        await runtime.read(query, undefined);
        const pending = runtime.read(delayed, undefined);
        await ready;
        queryClient.removeQueries({ queryKey: ['getDataset'] });
        await vi.advanceTimersByTimeAsync(30_000);
        expect(store.get(datasetFixture.ref)).toBeDefined();
        resume();
        await pending;
        await vi.advanceTimersByTimeAsync(30_000);
        expect(store.get(datasetFixture.ref)).toBeDefined();
    } finally {
        await runtime.dispose();
        vi.useRealTimers();
    }
});

it('gives a newly removed composition the full grace period', async () => {
    vi.useFakeTimers();
    const { runtime, query, store, queryClient } = createReadHarness();
    try {
        await runtime.read(query, undefined);
        await vi.advanceTimersByTimeAsync(15_000);
        queryClient.removeQueries({ queryKey: ['getDataset'] });
        await vi.advanceTimersByTimeAsync(29_999);
        expect(store.get(datasetFixture.ref)).toBeDefined();
        await vi.advanceTimersByTimeAsync(1);
        expect(store.get(datasetFixture.ref)).toBeUndefined();
    } finally {
        await runtime.dispose();
        vi.useRealTimers();
    }
});

it('retains explicit transient normalization roots until release', async () => {
    vi.useFakeTimers();
    const { runtime, query, store, queryClient } = createReadHarness();
    try {
        await runtime.read(query, undefined);
        const lease = runtime.acquireLease();
        lease.refs.add(datasetFixture.ref);
        queryClient.removeQueries({ queryKey: ['getDataset'] });
        await vi.advanceTimersByTimeAsync(30_000);
        expect(store.get(datasetFixture.ref)).toBeDefined();
        lease.release();
        await vi.advanceTimersByTimeAsync(30_000);
        expect(store.get(datasetFixture.ref)).toBeUndefined();
    } finally {
        await runtime.dispose();
        vi.useRealTimers();
    }
});
