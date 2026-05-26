import { describe, expect, it } from 'vitest';

import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';

import { filterDashboards, getChartIdsFromDatasets } from './filterDashboards';

const charts: Chart[] = [
    {
        id: 'chart-1',
        orgId: 'org-1',
        datasetId: 'dataset-1',
        name: 'Revenue',
        chartType: 'bar',
        config: {},
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'chart-2',
        orgId: 'org-1',
        datasetId: 'dataset-2',
        name: 'Status',
        chartType: 'pie',
        config: {},
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

describe('filterDashboards', () => {
    it('filters dashboards by chart and dataset membership', () => {
        expect(
            filterDashboards({
                dashboards,
                charts,
                chartIds: ['chart-1'],
                datasetIds: ['dataset-1'],
            })
        ).toEqual([dashboards[0]]);
    });

    it('extracts chart ids from selected datasets', () => {
        expect(Array.from(getChartIdsFromDatasets(charts, ['dataset-2']))).toEqual([
            'chart-2',
        ]);
    });
});
