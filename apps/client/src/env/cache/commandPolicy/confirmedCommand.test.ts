import { createCacheHarness } from '@/test/cacheFixtures';
import { QueryClient } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';

import { CacheRuntime } from '../runtime';

it('reports confirmed writes after failed normalization and isolates callback errors', async () => {
    const failure = new Error('normalization failed');
    const confirmed = vi.fn().mockRejectedValue(new Error('bridge failed'));
    const cache = new CacheRuntime(new QueryClient(), createCacheHarness().store, {
        onCommandConfirmed: confirmed,
    });
    const command = {
        execute: async () => ({ id: 'c' }),
        writes: () => ['chart' as const],
    };
    cache.registerCommand(command, {
        conflictKey: () => 'chart',
        affected: () => ['chart'],
        removals: () => [],
        codec: {
            normalize: async () => {
                throw failure;
            },
            resolve: () => ({ id: 'c' }),
        },
    });
    expect(await cache.runCommand(command, undefined)).toEqual({
        data: { id: 'c' },
        syncError: failure,
    });
    expect(confirmed).toHaveBeenCalledWith({ refs: ['chart'], epoch: 0 });
    await cache.execute(command, undefined);
    expect(confirmed).toHaveBeenCalledTimes(2);
    await cache.dispose();
});

it('does not forward rejected writes or retired confirmations', async () => {
    const confirmed = vi.fn();
    const cache = new CacheRuntime(new QueryClient(), createCacheHarness().store, {
        onCommandConfirmed: confirmed,
    });
    let finish!: () => void;
    const failure = new Error('write failed');
    const rejected = {
        execute: async () => {
            throw failure;
        },
        writes: () => ['chart' as const],
    };
    const delayed = {
        execute: () =>
            new Promise<void>(resolve => {
                finish = resolve;
            }),
        writes: () => ['chart' as const],
    };
    const policy = {
        conflictKey: () => 'chart',
        affected: () => ['chart' as const],
        removals: () => [],
        codec: {
            async normalize() {
                return { tree: { kind: 'value' as const, value: undefined }, refs: [] };
            },
            resolve() {},
        },
    };
    cache.registerCommand(rejected, policy);
    cache.registerCommand(delayed, policy);
    await expect(cache.execute(rejected, undefined)).rejects.toBe(failure);
    const pending = cache.execute(delayed, undefined);
    const cancelled = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(finish).toBeDefined());
    await cache.clear();
    finish();
    await cancelled;
    expect(confirmed).not.toHaveBeenCalled();
    await cache.dispose();
});
