import type { ChartKind } from './chartKind';

export type ChartDataPoint = { label: string; value: number };
export type ChartSeries = { name: string; points: ChartDataPoint[] };

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
    series: ChartSeries[];
    labels: string[];
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

const getMeasureIndexes = (columns: ChartResultColumn[]) => {
    const indexes = columns
        .map((column, index) => ({ column, index }))
        .filter(({ column }) => column.role === 'measure')
        .map(({ index }) => index);

    return indexes.length > 0 ? indexes : [getMeasureIndex(columns)];
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
    const measureIndexes = getMeasureIndexes(data.columns);
    const seriesIndex = getSeriesIndex(data.columns);
    const warnings: string[] = [];
    const labels: string[] = [];
    const seriesByName = new Map<string, ChartDataPoint[]>();
    let omittedRows = 0;
    let visualRowsTruncated = false;

    data.rows.slice(0, limit).forEach(row => {
        const dimension = String(row[dimensionIndex] ?? '');
        const series = seriesIndex === null ? null : String(row[seriesIndex] ?? '');

        if (!labels.includes(dimension)) {
            labels.push(dimension);
        }

        for (const measureIndex of measureIndexes) {
            const rawValue = row[measureIndex];

            if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
                omittedRows += 1;

                continue;
            }

            const measureName = data.columns[measureIndex]?.name ?? `m${measureIndex}`;
            const seriesName =
                measureIndexes.length > 1
                    ? series
                        ? `${series} / ${measureName}`
                        : measureName
                    : (series ?? measureName);
            const label = dimension;
            const point = { label, value: rawValue };

            seriesByName.set(seriesName, [...(seriesByName.get(seriesName) ?? []), point]);
        }
    });

    if (kind !== 'heatmap' && data.rows.length > limit) {
        visualRowsTruncated = true;
    }

    if (omittedRows > 0) {
        warnings.push('Rows with non-numeric measure values were omitted.');
    }

    if (visualRowsTruncated) {
        warnings.push(`Chart preview shows the first ${limit} result rows.`);
    }

    const series = [...seriesByName.entries()].map(([name, points]) => ({ name, points }));
    const points = series.flatMap(item =>
        item.points.map(point => ({
            label: series.length > 1 ? `${point.label} / ${item.name}` : point.label,
            value: point.value,
        }))
    );

    if (kind !== 'pie') {
        return { points, series, labels, warnings };
    }

    const positivePoints = points.filter(point => point.value > 0);

    if (positivePoints.length !== points.length) {
        warnings.push('Pie chart hides zero and negative values.');
    }

    if (positivePoints.length === 0 && points.length > 0) {
        warnings.push('Pie chart needs at least one positive value.');
    }

    return {
        points: positivePoints,
        series: [{ name: 'm0', points: positivePoints }],
        labels: positivePoints.map(point => point.label),
        warnings,
    };
};
