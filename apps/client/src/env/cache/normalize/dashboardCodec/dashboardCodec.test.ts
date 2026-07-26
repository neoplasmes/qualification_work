import { dashboardCodec, dashboardListCodec } from '.';
import type { Dashboard } from '@/core/entities/dashboard';
import { createCacheHarness } from '@/test/cacheFixtures';
import { expect, it } from 'vitest';

it('preserves enriched detail through sparse summaries and applies later detail null', async () => {
    const { store } = createCacheHarness();
    const board: Dashboard = {
        ref: 'dashboard:o/d',
        id: 'd',
        orgId: 'o',
        name: 'Board',
        createdAt: '',
        updatedAt: '',
        items: [
            {
                ref: 'dashboardItem:o/d/i',
                id: 'i',
                kind: 'metric',
                layout: { posX: 0, posY: 0, width: 3, height: 2 },
                datasetId: 'data',
                name: 'Cost',
                expression: 'sum(amount)',
                format: '₽',
                valueMultiplier: 1,
                target: 100,
                targetDirection: 'lower',
                showTrend: true,
                timeColumn: null,
                timeBucket: null,
                value: 42,
                trend: [{ bucket: '2026-01', value: 42 }],
            },
        ],
    };
    const detail = await dashboardCodec.normalize(board, undefined, store);
    const {
        value: _value,
        trend: _trend,
        ...summaryItem
    } = board.items[0] as Extract<Dashboard['items'][number], { kind: 'metric' }>;
    const list = await dashboardListCodec.normalize(
        [{ ...board, items: [summaryItem] }],
        undefined,
        store
    );
    expect(dashboardCodec.resolve(detail, store).items[0]).toMatchObject({
        value: 42,
        trend: [{ bucket: '2026-01', value: 42 }],
    });
    expect(dashboardListCodec.resolve(list, store)[0]).toBe(
        dashboardCodec.resolve(detail, store)
    );
    expect(store.get(board.ref)?.items).toEqual(['dashboardItem:o/d/i']);
    await dashboardCodec.normalize(
        { ...board, items: [{ ...summaryItem, value: null, trend: null }] },
        undefined,
        store
    );
    expect(dashboardCodec.resolve(detail, store).items[0]).toMatchObject({
        value: null,
        trend: null,
    });
    expect(dashboardCodec.resolve(detail, store)).not.toHaveProperty('$synced');
    await store.dispose();
});
