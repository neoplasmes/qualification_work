import { describe, expect, it } from 'vitest';

import type { DashboardItem } from '@/entities/dashboard';

import { splitDashboardItems } from './splitDashboardItems';

const items: DashboardItem[] = [
    {
        id: 'chart-1',
        kind: 'chart',
        chartId: 'saved-chart-1',
        layout: { posX: 0, posY: 0, width: 12, height: 8 },
    },
    {
        id: 'metric-1',
        kind: 'metric',
        datasetId: 'dataset-1',
        name: 'Revenue',
        expression: 'sum(amount)',
        format: 'currency',
        value: 100,
        layout: { posX: 0, posY: 1, width: 12, height: 4 },
    },
    {
        id: 'chart-2',
        kind: 'chart',
        chartId: 'saved-chart-2',
        layout: { posX: 0, posY: 2, width: 12, height: 8 },
    },
    {
        id: 'metric-2',
        kind: 'metric',
        datasetId: 'dataset-1',
        name: 'Count',
        expression: 'count(*)',
        format: 'number',
        value: 2,
        layout: { posX: 0, posY: 3, width: 12, height: 4 },
    },
];

describe('splitDashboardItems', () => {
    it('puts metrics before charts while preserving relative stack order', () => {
        const result = splitDashboardItems(items);

        expect(result.metricItems.map(item => item.id)).toEqual(['metric-1', 'metric-2']);
        expect(result.chartItems.map(item => item.id)).toEqual(['chart-1', 'chart-2']);
    });

    it('returns empty groups for empty dashboard', () => {
        expect(splitDashboardItems([])).toEqual({
            metricItems: [],
            chartItems: [],
        });
    });
});
