import type { Chart } from '@/core/entities/chart';
import type { Dashboard } from '@qualification-work/types';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
    filterDatasets,
    getChartIdsInDashboards,
    getDatasetIdsFromCharts,
} from './filterDatasets';

const datasets = [
    {
        dataset: {
            ref: 'dataset:org-1/dataset-1' as const,
            id: 'dataset-1',
            orgId: 'org-1',
            name: 'Invoices',
            sourceType: 'manual' as const,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [],
        totalRows: 1,
    },
    {
        dataset: {
            ref: 'dataset:org-1/dataset-2' as const,
            id: 'dataset-2',
            orgId: 'org-1',
            name: 'Payments',
            sourceType: 'manual' as const,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        columns: [],
        totalRows: 1,
    },
];

const charts: Chart[] = [
    {
        ref: `chart:${'org-1'}/${'chart-1'}`,
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
                values: {
                    charts: ['chart-1'],
                    dashboards: ['dashboard-1'],
                },
            })
        ).toEqual([datasets[0]]);
    });

    it('retains canonical element types and object identity', () => {
        const result = filterDatasets({
            datasets,
            charts,
            dashboards,
            values: { charts: ['chart-1'], dashboards: [] },
        });

        expectTypeOf(result).toEqualTypeOf<typeof datasets | undefined>();
        expect(result?.[0]).toBe(datasets[0]);
        expect(result?.[0]?.dataset.ref).toBe('dataset:org-1/dataset-1');
    });

    it('requires only dataset identity and preserves optional input', () => {
        const summaries = [{ dataset: { id: 'dataset-1' }, label: 'Selected' }];
        const result = filterDatasets({
            datasets: summaries,
            charts,
            dashboards,
            values: { charts: ['chart-1'], dashboards: [] },
        });

        expectTypeOf(result).toEqualTypeOf<typeof summaries | undefined>();
        expect(result?.[0]).toBe(summaries[0]);
        expect(
            filterDatasets({
                datasets: undefined,
                charts,
                dashboards,
                values: { charts: [], dashboards: [] },
            })
        ).toBeUndefined();
        expect(
            filterDatasets({
                datasets,
                charts,
                dashboards,
                values: { charts: [], dashboards: [] },
            })
        ).toBe(datasets);
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
