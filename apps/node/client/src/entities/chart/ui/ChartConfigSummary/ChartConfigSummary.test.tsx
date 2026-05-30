import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartConfigSummary } from './ChartConfigSummary';

const columns = [
    {
        id: 'col-cat',
        datasetId: 'd1',
        key: 'category',
        displayName: 'Категория',
        dataType: 'string',
        orderIndex: 0,
        isAnalyzable: true,
    },
    {
        id: 'col-rev',
        datasetId: 'd1',
        key: 'revenue',
        displayName: 'Выручка',
        dataType: 'number',
        orderIndex: 1,
        isAnalyzable: true,
    },
    {
        id: 'col-date',
        datasetId: 'd1',
        key: 'date',
        displayName: 'Дата',
        dataType: 'date',
        orderIndex: 2,
        isAnalyzable: true,
    },
] as const;

describe('ChartConfigSummary', () => {
    it('renders pie sliced by column with measure and between filter', () => {
        const { container } = render(
            <ChartConfigSummary
                chartType="pie"
                columns={columns}
                config={{
                    kind: 'pie',
                    slice: { columnId: 'col-cat', topN: 12, otherBucket: true },
                    measure: { aggregate: 'count', valueFormat: 'number' },
                    filters: [
                        {
                            columnId: 'col-date',
                            op: 'between',
                            value: ['2025-01-01', '2025-12-31'],
                        },
                    ],
                }}
            />
        );
        const text = container.textContent ?? '';
        expect(text).toContain('Pie');
        expect(text).toContain('sliced by Категория');
        expect(text).toContain('Count');
        expect(text).toContain('top 12 slices');
        expect(text).toContain('filtered where Дата between');
        expect(text).toContain('2025-01-01');
        expect(text).toContain('2025-12-31');
    });

    it('renders bar with series, rest grouped, and sum measure', () => {
        const { container } = render(
            <ChartConfigSummary
                chartType="bar"
                columns={columns}
                config={{
                    kind: 'bar',
                    dimension: { columnId: 'col-cat' },
                    series: { columnId: 'col-date', topN: 5, otherBucket: true },
                    measures: [
                        { aggregate: 'sum', columnId: 'col-rev', valueFormat: 'number' },
                    ],
                }}
            />
        );
        const text = container.textContent ?? '';
        expect(text).toContain('Bar');
        expect(text).toContain('Sum of Выручка');
        expect(text).toContain('per Категория');
        expect(text).toContain('separated by Дата');
        expect(text).toContain('top 5');
        expect(text).toContain('rest grouped');
    });

    it('renders heatmap with both axes and no filter clause', () => {
        const { container } = render(
            <ChartConfigSummary
                chartType="heatmap"
                columns={columns}
                config={{
                    kind: 'heatmap',
                    x: {
                        columnId: 'col-date',
                        grouping: { kind: 'time', granularity: 'month' },
                    },
                    y: { columnId: 'col-cat' },
                    measure: {
                        aggregate: 'avg',
                        columnId: 'col-rev',
                        valueFormat: 'number',
                    },
                }}
            />
        );
        const text = container.textContent ?? '';
        expect(text).toContain('Heatmap');
        expect(text).toContain('Average of Выручка');
        expect(text).toContain('Дата');
        expect(text).toContain('(by month)');
        expect(text).toContain('Категория');
        expect(text).not.toContain('filtered');
    });

    it('falls back to id when column has been removed', () => {
        const { container } = render(
            <ChartConfigSummary
                chartType="pie"
                columns={columns}
                config={{
                    kind: 'pie',
                    slice: { columnId: 'col-missing', topN: 5 },
                    measure: { aggregate: 'count', valueFormat: 'number' },
                }}
            />
        );
        expect(container.textContent ?? '').toContain('col-missing');
    });
});
