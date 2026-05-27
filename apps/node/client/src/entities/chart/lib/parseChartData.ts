import type { ChartResultColumn, MeasureValueFormat, TimeGranularity } from '../api';
import type { ChartKind } from './chartKind';

export type ChartDataPoint = {
    label: string;
    value: number;
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};
export type ChartSeries = { name: string; points: ChartDataPoint[] };

type ChartResultData = {
    columns: Array<Partial<ChartResultColumn> & Pick<ChartResultColumn, 'name'>>;
    rows: Array<Array<string | number | null>>;
};

export type ChartViewModel = {
    points: ChartDataPoint[];
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    warnings: string[];
};

const getDimensionIndex = (columns: ChartResultData['columns']) => {
    const index = columns.findIndex(column => column.role === 'dim');

    return index >= 0 ? index : 0;
};

const getMeasureIndex = (columns: ChartResultData['columns']) => {
    const index = columns.findIndex(column => column.role === 'measure');

    return index >= 0 ? index : Math.max(0, columns.length - 1);
};

const getMeasureIndexes = (columns: ChartResultData['columns']) => {
    const indexes = columns
        .map((column, index) => ({ column, index }))
        .filter(({ column }) => column.role === 'measure')
        .map(({ index }) => index);

    return indexes.length > 0 ? indexes : [getMeasureIndex(columns)];
};

const getSeriesIndex = (columns: ChartResultData['columns']) => {
    const index = columns.findIndex(column => column.role === 'series');

    return index >= 0 ? index : null;
};

export const parseChartResult = (
    data: ChartResultData,
    kind: ChartKind,
    limit: number
): ChartViewModel => {
    const dimensionIndex = getDimensionIndex(data.columns);
    const dimensionColumn = data.columns[dimensionIndex];
    const measureIndexes = getMeasureIndexes(data.columns);
    const seriesIndex = getSeriesIndex(data.columns);
    const primaryMeasureColumn = data.columns[measureIndexes[0]];
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
            const measureColumn = data.columns[measureIndex];
            const seriesName =
                measureIndexes.length > 1
                    ? series
                        ? `${series} / ${measureName}`
                        : measureName
                    : (series ?? measureName);
            const label = dimension;
            const point = {
                label,
                value: rawValue,
                labelTimeGranularity: dimensionColumn?.timeGranularity,
                valueFormat: measureColumn?.valueFormat,
            };

            seriesByName.set(seriesName, [
                ...(seriesByName.get(seriesName) ?? []),
                point,
            ]);
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

    let series = [...seriesByName.entries()].map(([name, points]) => ({
        name,
        points,
    }));

    // line cant draw a single-point series (renders as a stray dot) - drop it
    if (kind === 'line') {
        series = series.filter(item => item.points.length >= 2);
    }

    // bar must not render zero-height columns - strip them and drop empty series
    if (kind === 'bar') {
        series = series
            .map(item => ({
                ...item,
                points: item.points.filter(point => point.value !== 0),
            }))
            .filter(item => item.points.length > 0);
    }

    // labels follow the surviving points (preserves original category order)
    const usedLabels = new Set<string>();
    for (const item of series) {
        for (const point of item.points) {
            usedLabels.add(point.label);
        }
    }
    const effectiveLabels =
        kind === 'line' || kind === 'bar'
            ? labels.filter(label => usedLabels.has(label))
            : labels;

    const points = series.flatMap(item =>
        item.points.map(point => ({
            label: series.length > 1 ? `${point.label} / ${item.name}` : point.label,
            value: point.value,
        }))
    );

    if (kind !== 'pie') {
        return {
            points,
            series,
            labels: effectiveLabels,
            labelTimeGranularity: dimensionColumn?.timeGranularity,
            valueFormat: primaryMeasureColumn?.valueFormat,
            warnings,
        };
    }

    const positivePoints = points.filter(point => point.value > 0);

    if (positivePoints.length === 0 && points.length > 0) {
        warnings.push('Pie chart needs at least one positive value.');
    }

    return {
        points: positivePoints,
        series: [{ name: 'm0', points: positivePoints }],
        labels: positivePoints.map(point => point.label),
        labelTimeGranularity: dimensionColumn?.timeGranularity,
        valueFormat: primaryMeasureColumn?.valueFormat,
        warnings,
    };
};
