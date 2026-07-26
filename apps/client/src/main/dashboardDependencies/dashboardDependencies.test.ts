import { createDashboardDependencies } from '.';
import { CacheRuntime } from '@/env/cache/runtime';
import { HttpTransport } from '@/env/transport/http';
import { createCacheHarness } from '@/test/cacheFixtures';
import { deferred } from '@/test/readFixtures';
import { expect, it, vi } from 'vitest';

it('serializes each dashboard while allowing a different dashboard to write', async () => {
    const { queryClient, store } = createCacheHarness();
    const cache = new CacheRuntime(queryClient, store);
    const gate = deferred<Response>();
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementationOnce(() => gate.promise)
        .mockImplementation(async () => new Response(null, { status: 204 }));
    const operations = createDashboardDependencies(
        cache,
        new HttpTransport({ baseUrl: '/api', fetch })
    );
    const first = cache.runCommand(operations.renameDashboard, {
        orgId: 'o',
        dashboardId: 'd',
        name: 'first',
    });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const second = cache.runCommand(operations.renameDashboard, {
        orgId: 'o',
        dashboardId: 'd',
        name: 'second',
    });
    const independent = cache.runCommand(operations.renameDashboard, {
        orgId: 'o',
        dashboardId: 'other',
        name: 'other',
    });
    await independent;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1]![0]).toBe('/api/dashboards/other');
    gate.resolve(new Response(null, { status: 204 }));
    await Promise.all([first, second]);
    expect(JSON.parse(String(fetch.mock.calls[2]![1]?.body))).toEqual({ name: 'second' });
    await cache.dispose();
});

it('removes an item record and invalidates detail composition after confirmed deletion', async () => {
    const { queryClient, store } = createCacheHarness();
    const cache = new CacheRuntime(queryClient, store);
    const operations = createDashboardDependencies(
        cache,
        new HttpTransport({
            baseUrl: '/api',
            fetch: vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
        })
    );
    const ref = 'dashboardItem:o/d/i' as const;
    await store.upsert(ref, {
        id: 'i',
        kind: 'chart',
        chartId: 'c',
        layout: { posX: 0, posY: 0, width: 6, height: 8 },
    });
    await cache.runCommand(operations.removeDashboardItem, {
        orgId: 'o',
        dashboardId: 'd',
        itemId: 'i',
    });
    expect(store.get(ref)).toBeUndefined();
    expect(
        operations.removeDashboardItem.writes(
            { orgId: 'o', dashboardId: 'd', itemId: 'i' },
            undefined
        )
    ).toEqual(['dashboard', 'dashboard:o/d', 'dashboardItem']);
    await cache.dispose();
});

it.each(['removed', 'stale'])(
    'checks fresh nested composition after deletion: %s',
    async responseMode => {
        const { queryClient, store } = createCacheHarness();
        const cache = new CacheRuntime(queryClient, store);
        let removed = false;
        const items = ['i', 'kept'].map((id, index) => ({
            id,
            kind: 'chart',
            chartId: 'c',
            layout: { posX: index * 6, posY: 0, width: 6, height: 8 },
        }));
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockImplementation(async (url, options) => {
                if (options?.method === 'DELETE') {
                    removed = true;

                    return new Response(null, { status: 204 });
                }
                const board = {
                    id: 'd',
                    orgId: 'o',
                    name: 'Board',
                    items: removed && responseMode !== 'stale' ? items.slice(1) : items,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                };

                return Response.json(String(url).includes('?') ? [board] : board);
            });
        const operations = createDashboardDependencies(
            cache,
            new HttpTransport({ baseUrl: '/api', fetch })
        );
        const scope = { orgId: 'o', dashboardId: 'd' };
        await cache.read(operations.listDashboards, { orgId: 'o' });
        await cache.runCommand(operations.removeDashboardItem, { ...scope, itemId: 'i' });
        if (responseMode === 'stale') {
            await expect(
                cache.read(operations.listDashboards, { orgId: 'o' })
            ).rejects.toThrow('dashboardItem:o/d/i');
            expect(store.get('dashboardItem:o/d/i')).toBeUndefined();
            expect(cache.tombstones.has('dashboardItem:o/d/i')).toBe(true);
            await cache.dispose();

            return;
        }
        const list = await cache.read(operations.listDashboards, { orgId: 'o' });
        const detail = await cache.read(operations.getDashboard, scope);
        expect(list[0]?.items.map(item => item.id)).toEqual(['kept']);
        expect(detail.items.map(item => item.id)).toEqual(['kept']);
        expect(store.get('dashboardItem:o/d/i')).toBeUndefined();
        expect(cache.tombstones.has('dashboardItem:o/d/i')).toBe(true);
        await cache.dispose();
    }
);
