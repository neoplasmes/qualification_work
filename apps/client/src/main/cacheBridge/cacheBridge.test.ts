import { CacheRuntime } from '@/env/cache/runtime';
import { createCacheHarness } from '@/test/cacheFixtures';
import { expect, it, vi } from 'vitest';

import { createCacheBridge } from './cacheBridge';

it('leaves both caches untouched after the final legacy domain migration', async () => {
    const { queryClient, store } = createCacheHarness();
    const cache = new CacheRuntime(queryClient, store);
    const report = vi.fn();
    const bridge = createCacheBridge(cache, report);
    const dispatch = vi.fn();
    bridge.attach(dispatch);
    const invalidate = vi.spyOn(cache.invalidator, 'invalidate');
    const next = vi.fn(action => action);
    const middleware = bridge.middleware({ dispatch, getState: () => ({}) })(next);
    for (const status of ['pending', 'fulfilled', 'rejected']) {
        const action = {
            type: `rtkApi/executeMutation/${status}`,
            meta: {
                requestId: 'old',
                arg: {
                    endpointName: 'renameDashboard',
                    originalArgs: { dashboardId: 'd' },
                },
            },
        };
        expect(middleware(action)).toBe(action);
    }
    bridge.invalidate({
        refs: ['dashboard', 'dashboardItem', 'dataset'],
        epoch: cache.epoch,
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
    bridge.dispose();
    await cache.dispose();
});
