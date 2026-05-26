import { describe, expect, it } from 'vitest';

import type { DashboardItem } from '@/entities/dashboard';

import { getDashboardItemsOrder, moveDashboardItem } from './reorderDashboardItems';

const items: DashboardItem[] = [
    {
        id: 'item-1',
        kind: 'chart',
        chartId: 'chart-1',
        layout: { posX: 0, posY: 0, width: 4, height: 3 },
    },
    {
        id: 'item-2',
        kind: 'metric',
        datasetId: 'dataset-1',
        name: 'Average',
        expression: 'avg(score)',
        format: 'number',
        layout: { posX: 0, posY: 1, width: 4, height: 2 },
    },
];

describe('dashboard item reorder helpers', () => {
    it('moves items and builds backend order payload', () => {
        const moved = moveDashboardItem(items, 'item-2', -1);

        expect(moved.map(item => item.id)).toEqual(['item-2', 'item-1']);
        expect(getDashboardItemsOrder(moved)).toEqual([
            { itemId: 'item-2', posY: 0 },
            { itemId: 'item-1', posY: 1 },
        ]);
    });

    it('returns original array when move is impossible', () => {
        expect(moveDashboardItem(items, 'item-1', -1)).toBe(items);
    });
});
