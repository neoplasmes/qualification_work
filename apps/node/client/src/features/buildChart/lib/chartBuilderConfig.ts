import {
    normalizeChartColor,
    type ChartConfig,
    type FilterClause,
} from '@/entities/chart';

import type {
    Aggregate,
    AxisGrouping,
    MeasureValueFormat,
    TimeGranularity,
} from '../api';
import type { GroupingMode } from '../types';

export type BuildChartConfigInput = {
    chartType: ChartConfig['kind'];
    chartColor: string;
    dimensionColumnId: string;
    dimensionGrouping: AxisGrouping | undefined;
    heatmapYColumnId: string;
    heatmapYGrouping: AxisGrouping | undefined;
    aggregate: Aggregate;
    valueFormat: MeasureValueFormat;
    measureColumnId: string;
    secondMeasureEnabled: boolean;
    secondAggregate: Aggregate;
    secondValueFormat: MeasureValueFormat;
    secondMeasureColumnId: string;
    limit: number;
    topN: number;
    seriesEnabled: boolean;
    seriesColumnId: string;
    seriesTopN: number;
    seriesOtherBucket: boolean;
    filter: FilterClause | null;
};

export const needsColumn = (aggregate: Aggregate) => aggregate !== 'count';

export const buildGrouping = (
    mode: GroupingMode,
    granularity: TimeGranularity,
    step: number
): AxisGrouping | undefined => {
    if (mode === 'time') {
        return { kind: 'time', granularity };
    }

    if (mode === 'numeric') {
        return { kind: 'numeric', step };
    }

    return undefined;
};

const buildMeasure = (
    aggregate: Aggregate,
    measureColumnId: string,
    valueFormat: MeasureValueFormat,
    alias?: string
) =>
    aggregate === 'count'
        ? { aggregate, valueFormat, ...(alias ? { alias } : {}) }
        : {
              aggregate,
              columnId: measureColumnId,
              valueFormat,
              ...(alias ? { alias } : {}),
          };

export const buildChartConfig = ({
    chartType,
    chartColor,
    dimensionColumnId,
    dimensionGrouping,
    heatmapYColumnId,
    heatmapYGrouping,
    aggregate,
    valueFormat,
    measureColumnId,
    secondMeasureEnabled,
    secondAggregate,
    secondValueFormat,
    secondMeasureColumnId,
    limit,
    topN,
    seriesEnabled,
    seriesColumnId,
    seriesTopN,
    seriesOtherBucket,
    filter,
}: BuildChartConfigInput): ChartConfig => {
    const firstMeasure = buildMeasure(aggregate, measureColumnId, valueFormat);
    const base = {
        limit,
        style: { color: normalizeChartColor(chartColor) },
        ...(filter ? { filters: [filter] } : {}),
    };

    if (chartType === 'pie') {
        return {
            ...base,
            kind: 'pie',
            slice: { columnId: dimensionColumnId, topN, otherBucket: true },
            measure: firstMeasure,
        };
    }

    if (chartType === 'heatmap') {
        return {
            ...base,
            kind: 'heatmap',
            x: {
                columnId: dimensionColumnId,
                ...(dimensionGrouping ? { grouping: dimensionGrouping } : {}),
            },
            y: {
                columnId: heatmapYColumnId,
                ...(heatmapYGrouping ? { grouping: heatmapYGrouping } : {}),
            },
            measure: firstMeasure,
        };
    }

    const measures = [
        firstMeasure,
        ...(secondMeasureEnabled
            ? [
                  buildMeasure(
                      secondAggregate,
                      secondMeasureColumnId,
                      secondValueFormat,
                      'm1'
                  ),
              ]
            : []),
    ];

    return {
        ...base,
        kind: chartType,
        orderBy: { ref: 'dim', index: 0, dir: 'asc' },
        dimension: {
            columnId: dimensionColumnId,
            ...(dimensionGrouping ? { grouping: dimensionGrouping } : {}),
        },
        ...(seriesEnabled
            ? {
                  series: {
                      columnId: seriesColumnId,
                      topN: seriesTopN,
                      ...(chartType === 'bar' ? { otherBucket: seriesOtherBucket } : {}),
                  },
              }
            : {}),
        measures,
    };
};
