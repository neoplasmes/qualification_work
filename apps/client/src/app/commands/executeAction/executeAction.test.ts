import type { EntityRef } from '@/core/entities/entityRef';
import { valueCodec } from '@/env/cache/normalize';
import { CacheRuntime } from '@/env/cache/runtime';
import { HttpTransport, NetworkError } from '@/env/transport/http';
import { createActionDependencies } from '@/main/actionDependencies';
import { createCacheHarness, rowFixture } from '@/test/cacheFixtures';
import { expect, it, vi } from 'vitest';

import type { Query } from '@/app/queries/query';

const run = {
    id: 'run',
    actionId: 'action',
    orgId: 'org-1',
    userId: 'user',
    parameters: {},
    status: 'success',
    errorMessage: null,
    executedAt: '2026-01-01',
    changes: [0, 1].map(() => ({
        kind: 'updateRowsByMatch',
        datasetId: 'dataset-1',
        match: { columnKey: 'a', value: 1 },
        rowIds: ['row-1'],
        before: [{ rowId: 'row-1', rowIndex: 0, data: { a: 1 } }],
        after: [{ rowId: 'row-1', rowIndex: 0, data: { a: 2 } }],
    })),
};
it.each(['success', 'failed', 'network'])(
    'reconciles %s exactly once without replacing current rows with snapshots',
    async kind => {
        const { queryClient, store } = createCacheHarness();
        const cache = new CacheRuntime(queryClient, store);
        const transport = new HttpTransport({ baseUrl: '/api', fetch: vi.fn() });
        const request = vi.spyOn(transport, 'request').mockImplementation(async () => {
            if (kind === 'network') {
                throw new NetworkError('connection lost');
            }

            return { ...run, status: kind };
        });
        const operations = createActionDependencies(cache, transport);
        const input = { orgId: 'org-1', actionId: 'action', parameters: {} };
        const queries = [];
        for (const family of [
            'datasetRow',
            'chartData',
            'metricPreview',
            'actionRun',
            'dashboard',
        ] as EntityRef[]) {
            const query: Query<void, number> = {
                name: family,
                execute: async () => 1,
                reads: () => [family],
            };
            cache.registerRead(query, valueCodec());
            await cache.read(query, undefined);
            queries.push(
                queryClient.getQueryCache().find({ queryKey: [family, undefined] })!
            );
        }
        await store.upsert(rowFixture.ref, rowFixture);
        if (kind === 'network') {
            await expect(
                cache.execute(operations.executeAction, input)
            ).rejects.toThrow();
        } else {
            const result = await cache.execute(operations.executeAction, input);
            expect(result.status).toBe(kind);
            const writes = operations.executeAction.writes(input, result);
            expect(writes).toContain('dataset:org-1/dataset-1');
            expect(new Set(writes).size).toBe(writes.length);
        }
        expect(request).toHaveBeenCalledTimes(1);
        for (const query of queries) {
            expect(query.state.isInvalidated).toBe(true);
        }
        expect(store.get(rowFixture.ref)?.data).toEqual(rowFixture.data);
        await cache.dispose();
    }
);
