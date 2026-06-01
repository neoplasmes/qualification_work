import {
    getChartColorFromConfig,
    type ChartType,
    type FilterOperation,
} from '@/entities/chart';

import type { Aggregate, MeasureValueFormat, TimeGranularity } from '../api';
import type { GroupingMode } from '../types';
import type { ChartBuilderFields, MeasureField } from './useChartBuilderState';

const getGroupingMode = (grouping: unknown): GroupingMode => {
    const value = grouping as { kind?: string } | undefined | null;

    if (value?.kind === 'time') {
        return 'time';
    }

    if (value?.kind === 'numeric') {
        return 'numeric';
    }

    return 'none';
};

type MeasureConfig = {
    aggregate?: Aggregate;
    columnId?: string;
    valueFormat?: MeasureValueFormat;
};

const toMeasureField = (measure: MeasureConfig | undefined): MeasureField => ({
    aggregate: measure?.aggregate ?? 'count',
    valueFormat: measure?.valueFormat ?? '',
    columnId: measure?.columnId ?? '',
});

const applyMeasures = (
    result: Partial<ChartBuilderFields>,
    measures: Array<MeasureConfig | undefined> | undefined
) => {
    const list = (measures ?? []).filter(
        (measure): measure is MeasureConfig => measure != null
    );
    result.measures = list.length
        ? list.map(toMeasureField)
        : [toMeasureField(undefined)];
};

const applyAxisFields = (
    result: Partial<ChartBuilderFields>,
    axis: { columnId?: string; grouping?: unknown } | undefined,
    field: 'dimension' | 'heatmapY'
) => {
    const grouping = axis?.grouping as
        | { granularity?: TimeGranularity; step?: number }
        | undefined;
    const columnKey = field === 'dimension' ? 'dimensionColumnId' : 'heatmapYColumnId';
    const modeKey =
        field === 'dimension' ? 'dimensionGroupingMode' : 'heatmapYGroupingMode';
    const granularityKey =
        field === 'dimension' ? 'dimensionGranularity' : 'heatmapYGranularity';
    const stepKey = field === 'dimension' ? 'dimensionStep' : 'heatmapYStep';

    if (axis?.columnId) {
        result[columnKey] = axis.columnId;
    }
    result[modeKey] = getGroupingMode(axis?.grouping);
    if (grouping?.granularity) {
        result[granularityKey] = grouping.granularity;
    }
    if (grouping?.step !== undefined) {
        result[stepKey] = grouping.step;
    }
};

export const configToBuilderFields = (
    config: Record<string, unknown>,
    chartType: ChartType
): Partial<ChartBuilderFields> => {
    const result: Partial<ChartBuilderFields> = { chartType };
    const filters = config.filters as
        | Array<{ columnId: string; op: FilterOperation; value?: unknown }>
        | undefined;

    result.chartColor = getChartColorFromConfig(config);

    if (typeof config.limit === 'number') {
        result.limit = config.limit;
    }

    if (filters?.[0]) {
        result.filterEnabled = true;
        result.filterColumnId = filters[0].columnId;
        result.filterOperation = filters[0].op;
        const value = filters[0].value;
        if (Array.isArray(value)) {
            result.filterValue = value.join(', ');
        } else if (value !== undefined && value !== null) {
            result.filterValue = String(value);
        }
    }

    if (chartType === 'pie') {
        const slice = config.slice as
            | { columnId?: string; topN?: number; otherBucket?: boolean }
            | undefined;
        const measure = config.measure as MeasureConfig | undefined;

        if (slice?.columnId) {
            result.dimensionColumnId = slice.columnId;
        }
        if (slice?.topN !== undefined) {
            result.topN = slice.topN;
        }
        if (slice?.otherBucket !== undefined) {
            result.seriesOtherBucket = slice.otherBucket;
        }
        applyMeasures(result, [measure]);

        return result;
    }

    if (chartType === 'heatmap') {
        const x = config.x as { columnId?: string; grouping?: unknown } | undefined;
        const y = config.y as { columnId?: string; grouping?: unknown } | undefined;
        const measure = config.measure as MeasureConfig | undefined;

        applyAxisFields(result, x, 'dimension');
        applyAxisFields(result, y, 'heatmapY');
        applyMeasures(result, [measure]);

        return result;
    }

    const dimension = config.dimension as
        | { columnId?: string; grouping?: unknown }
        | undefined;
    const series = config.series as
        | { columnId?: string; topN?: number; otherBucket?: boolean }
        | undefined;
    const measures = config.measures as MeasureConfig[] | undefined;

    applyAxisFields(result, dimension, 'dimension');
    result.seriesEnabled = Boolean(series);
    if (series?.columnId) {
        result.seriesColumnId = series.columnId;
    }
    if (series?.topN !== undefined) {
        result.seriesTopN = series.topN;
    }
    if (series?.otherBucket !== undefined) {
        result.seriesOtherBucket = series.otherBucket;
    }

    applyMeasures(result, measures);

    return result;
};
