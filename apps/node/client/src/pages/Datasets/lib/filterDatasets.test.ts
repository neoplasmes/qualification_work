import { describe, expect, it } from 'vitest';

import type { Chart } from '@/entities/chart';
import type { Dashboard } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import {
    filterDatasets,
    getChartIdsInDashboards,
    getDatasetIdsFromCharts,
} from './filterDatasets';

const datasets: DatasetMetadata[] = [
    {
        dataset: {
            id: 'dataset-1',
            orgId: 'org-1',
            name: 'Invoices',
            sourceType: 'manual',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [],
        totalRows: 1,
    },
    {
        dataset: {
            id: 'dataset-2',
            orgId: 'org-1',
            name: 'Payments',
            sourceType: 'manual',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [],
        totalRows: 1,
    },
];

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

describe('filterDatasets', () => {
    it('filters datasets by chart and dashboard relationships', () => {
        expect(
            filterDatasets({
                datasets,
                charts,
                dashboards,
                chartIds: ['chart-1'],
                dashboardIds: ['dashboard-1'],
            })
        ).toEqual([datasets[0]]);
    });

    it('extracts relationship ids', () => {
        expect(Array.from(getDatasetIdsFromCharts(charts, ['chart-1']))).toEqual([
            'dataset-1',
        ]);
        expect(Array.from(getChartIdsInDashboards(dashboards, ['dashboard-1']))).toEqual([
            'chart-1',
        ]);
    });
});
