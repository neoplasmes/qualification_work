import { describe, expect, it } from 'vitest';

import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';

import { filterCharts, getChartIdsInDashboards } from './filterCharts';

const charts: Chart[] = [
    {
        id: 'chart-1',
        orgId: 'org-1',
        datasetId: 'dataset-1',
        name: 'Revenue',
        chartType: 'bar',
        config: {
            kind: 'bar',
            dimension: { columnId: 'column-1' },
            measures: [{ aggregate: 'count' }],
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'chart-2',
        orgId: 'org-1',
        datasetId: 'dataset-2',
        name: 'Status',
        chartType: 'pie',
        config: {
            kind: 'bar',
            dimension: { columnId: 'column-1' },
            measures: [{ aggregate: 'count' }],
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
];

const dashboards: Dashboard[] = [
    {
        id: 'dashboard-1',
        orgId: 'org-1',
        name: 'Sales',
        items: [
            {
                id: 'item-1',
                kind: 'chart',
                chartId: 'chart-1',
                layout: { posX: 0, posY: 0, width: 4, height: 3 },
            },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
];

describe('filterCharts', () => {
    it('filters charts by dataset and dashboard membership', () => {
        expect(
            filterCharts({
                charts,
                dashboards,
                datasetIds: ['dataset-1'],
                dashboardIds: ['dashboard-1'],
            })
        ).toEqual([charts[0]]);
    });

    it('extracts chart ids only from selected dashboards', () => {
        expect(Array.from(getChartIdsInDashboards(dashboards, ['dashboard-1']))).toEqual([
            'chart-1',
        ]);
    });
});
