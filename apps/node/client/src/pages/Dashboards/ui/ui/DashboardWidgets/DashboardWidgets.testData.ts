import type { Chart } from '@/entities/chart';
import type { DashboardItem } from '@/entities/dashboard';

export const chart: Chart = {
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
};

export const secondChart: Chart = {
    ...chart,
    id: 'chart-2',
    name: 'Costs',
};

export const items: DashboardItem[] = [
    {
        id: 'item-chart',
        kind: 'chart',
        chartId: 'chart-1',
        layout: { posX: 0, posY: 0, width: 12, height: 8 },
    },
    {
        id: 'item-metric',
        kind: 'metric',
        datasetId: 'dataset-1',
        name: 'Average score',
        expression: 'avg(score)',
        format: 'percent',
        target: null,
        targetDirection: null,
        showTrend: false,
        timeColumn: null,
        timeBucket: null,
        value: 0.42,
        layout: { posX: 0, posY: 8, width: 3, height: 2 },
    },
    {
        id: 'item-chart-2',
        kind: 'chart',
        chartId: 'chart-2',
        layout: { posX: 0, posY: 10, width: 12, height: 8 },
    },
];
