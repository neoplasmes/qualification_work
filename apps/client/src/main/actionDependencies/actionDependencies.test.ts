import { createActionDependencies } from '.';
import { CacheRuntime } from '@/env/cache/runtime';
import {
    ContractViolationError,
    HttpError,
    HttpTransport,
    NetworkError,
} from '@/env/transport/http';
import { createCacheHarness } from '@/test/cacheFixtures';
import { deferred } from '@/test/readFixtures';
import { expect, it, vi } from 'vitest';

import { createCacheBridge } from '../cacheBridge';

it.each([
    new HttpError(404, { error: 'No rows matched action' }),
    new NetworkError(),
    new ContractViolationError(),
])('invalidates remaining legacy dashboards while preserving $name', async failure => {
    const { queryClient, store } = createCacheHarness();
    const cache = new CacheRuntime(queryClient, store);
    const bridge = createCacheBridge(cache, vi.fn());
    const dispatch = vi.fn();
    bridge.attach(dispatch);
    const transport = new HttpTransport({ baseUrl: '/api', fetch: vi.fn() });
    vi.spyOn(transport, 'request').mockRejectedValue(failure);
    const operations = createActionDependencies(cache, transport, bridge);
    await expect(
        operations.executeAction.execute({ orgId: 'org', actionId: 'a', parameters: {} })
    ).rejects.toBe(failure);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]![0].payload).toEqual(['Dashboards']);
    bridge.dispose();
    await cache.dispose();
});
it.each(['epoch', 'disposed'])(
    'ignores old execution errors after %s retirement',
    async mode => {
        const { queryClient, store } = createCacheHarness();
        const cache = new CacheRuntime(queryClient, store);
        const bridge = createCacheBridge(cache, vi.fn());
        const dispatch = vi.fn();
        bridge.attach(dispatch);
        const gate = deferred<unknown>();
        const transport = new HttpTransport({ baseUrl: '/api', fetch: vi.fn() });
        vi.spyOn(transport, 'request').mockImplementation(() => gate.promise);
        const operations = createActionDependencies(cache, transport, bridge);
        const pending = operations.executeAction.execute({
            orgId: 'org',
            actionId: 'a',
            parameters: {},
        });
        const failure = new NetworkError();
        const rejected = expect(pending).rejects.toBe(failure);
        if (mode === 'epoch') {
            await cache.clear();
        } else {
            bridge.dispose();
        }
        gate.reject(failure);
        await rejected;
        expect(dispatch).not.toHaveBeenCalled();
        bridge.dispose();
        await cache.dispose();
    }
);
it('reports a legacy refresh error without replacing the execution error', async () => {
    const { queryClient, store } = createCacheHarness();
    const cache = new CacheRuntime(queryClient, store);
    const bridge = createCacheBridge(cache, vi.fn());
    const syncFailure = new Error('bridge failed');
    bridge.attach(() => {
        throw syncFailure;
    });
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const transport = new HttpTransport({ baseUrl: '/api', fetch: vi.fn() });
    const failure = new HttpError(404);
    vi.spyOn(transport, 'request').mockRejectedValue(failure);
    const operations = createActionDependencies(cache, transport, bridge);
    await expect(
        operations.executeAction.execute({ orgId: 'org', actionId: 'a', parameters: {} })
    ).rejects.toBe(failure);
    expect(report).toHaveBeenCalledWith(
        'Legacy dashboard synchronization failed',
        syncFailure
    );
    report.mockRestore();
    bridge.dispose();
    await cache.dispose();
});
