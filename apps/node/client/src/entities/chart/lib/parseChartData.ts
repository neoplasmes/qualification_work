import type { ChartKind } from './chartKind';

export type ChartDataPoint = { label: string; value: number };

type ChartResultColumn = {
    name: string;
    role?: 'dim' | 'series' | 'measure';
};

type ChartResultData = {
    columns: ChartResultColumn[];
    rows: Array<Array<string | number | null>>;
};

export type ChartViewModel = {
    points: ChartDataPoint[];
    warnings: string[];
};

const getDimensionIndex = (columns: ChartResultColumn[]) => {
    const index = columns.findIndex(column => column.role === 'dim');

    return index >= 0 ? index : 0;
};

const getMeasureIndex = (columns: ChartResultColumn[]) => {
    const index = columns.findIndex(column => column.role === 'measure');

    return index >= 0 ? index : Math.max(0, columns.length - 1);
};

const getSeriesIndex = (columns: ChartResultColumn[]) => {
    const index = columns.findIndex(column => column.role === 'series');

    return index >= 0 ? index : null;
};

export const parseChartResult = (
    data: ChartResultData,
    kind: ChartKind,
    limit: number
): ChartViewModel => {
    const dimensionIndex = getDimensionIndex(data.columns);
    const measureIndex = getMeasureIndex(data.columns);
    const seriesIndex = getSeriesIndex(data.columns);
    const warnings: string[] = [];

    const points = data.rows.slice(0, limit).map(row => {
        const dimension = String(row[dimensionIndex] ?? '');
        const series = seriesIndex === null ? null : String(row[seriesIndex] ?? '');

        return {
            label: series ? `${dimension} / ${series}` : dimension,
            value: typeof row[measureIndex] === 'number' ? row[measureIndex] : 0,
        };
    });

    if (kind !== 'pie') {
        return { points, warnings };
    }

    const positivePoints = points.filter(point => point.value > 0);

    if (positivePoints.length !== points.length) {
        warnings.push('Pie chart hides zero and negative values.');
    }

    if (positivePoints.length === 0 && points.length > 0) {
        warnings.push('Pie chart needs at least one positive value.');
    }

    return { points: positivePoints, warnings };
};
