import { CacheRuntime } from '@/env/cache/runtime';
import { createCacheHarness } from '@/test/cacheFixtures';
import { expect, it, vi } from 'vitest';

import { createQueryClient } from '../queryClient';
import { createCacheBridge } from './cacheBridge';

it('forwards only confirmed current legacy writes using actual scoped read dependencies', async () => {
    const cache = new CacheRuntime(createQueryClient(), createCacheHarness().store);
    const bridge = createCacheBridge(cache, vi.fn());
    const dispatch = vi.fn();
    bridge.attach(dispatch);
    const next = vi.fn();
    const middleware = bridge.middleware({ dispatch, getState: () => ({}) })(next);
    cache.queryClient.setQueryDefaults(['getChart'], {
        meta: { normalizedRead: true, dependencies: ['chart:org/c'] },
    });
    cache.queryClient.setQueryData(['getChart', { orgId: 'org', chartId: 'c' }], {
        tree: { kind: 'value', value: null },
        refs: [],
    });
    const action = (status: string, id: string) => ({
        type: `rtkApi/executeMutation/${status}`,
        meta: {
            requestId: id,
            arg: {
                endpointName: 'patchChart',
                originalArgs: { chartId: 'c', name: 'Name' },
            },
        },
    });
    middleware(action('pending', 'old'));
    await cache.clear();
    middleware(action('fulfilled', 'old'));
    expect(dispatch).not.toHaveBeenCalled();
    cache.queryClient.setQueryData(['getChart', { orgId: 'org', chartId: 'c' }], {
        tree: { kind: 'value', value: null },
        refs: [],
    });
    middleware(action('pending', 'new'));
    middleware(action('fulfilled', 'new'));
    await vi.waitFor(() =>
        expect(
            cache.queryClient.getQueryState(['getChart', { orgId: 'org', chartId: 'c' }])
                ?.isInvalidated
        ).toBe(true)
    );
    bridge.confirmed({ refs: ['chart', 'dashboard'], epoch: cache.epoch });
    expect(dispatch.mock.calls[0]?.[0].payload).toEqual(['Charts', 'Dashboards']);
    bridge.dispose();
    await cache.dispose();
});

it('keeps a confirmed legacy write successful when an active refresh fails', async () => {
    const cache = new CacheRuntime(createQueryClient(), createCacheHarness().store);
    let fails = false;
    const failure = new Error('read failed');
    const query = {
        name: 'listCharts',
        reads: () => ['chart' as const],
        execute: async () => {
            if (fails) {
                throw failure;
            }

            return 'initial';
        },
    };
    cache.registerRead(query, {
        async normalize(value) {
            return { tree: { kind: 'value', value }, refs: [] };
        },
        resolve(result) {
            return result.tree.kind === 'value' ? String(result.tree.value) : '';
        },
    });
    await cache.read(query, undefined);
    const { QueryObserver } = await import('@tanstack/react-query');
    const { queryOptionsFor } = await import('@/env/cache/queryOptionsFor');
    const observer = new QueryObserver(cache.queryClient, {
        ...queryOptionsFor(cache, query, undefined),
        staleTime: Infinity,
    });
    const stop = observer.subscribe(() => {});
    const report = vi.fn();
    const bridge = createCacheBridge(cache, report);
    const next = vi.fn(action => action);
    const middleware = bridge.middleware({ dispatch: vi.fn(), getState: () => ({}) })(
        next
    );
    const meta = {
        requestId: 'write',
        arg: { endpointName: 'createChart', originalArgs: {} },
    };
    middleware({ type: 'rtkApi/executeMutation/pending', meta });
    fails = true;
    const confirmed = { type: 'rtkApi/executeMutation/fulfilled', meta };
    expect(middleware(confirmed)).toBe(confirmed);
    await vi.waitFor(() => expect(report).toHaveBeenCalledWith(failure));
    expect(observer.getCurrentResult().error).toBe(failure);
    stop();
    bridge.dispose();
    await cache.dispose();
});
