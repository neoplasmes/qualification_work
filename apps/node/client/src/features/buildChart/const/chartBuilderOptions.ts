import type { ChartType, FilterOperation } from '@/entities/chart';

import type { Aggregate, MeasureValueFormat, TimeGranularity } from '../api';
import type { GroupingMode } from '../types';

export const chartTypes = ['bar', 'line', 'pie', 'heatmap'] as const;

export const aggregates = [
    'count',
    'sum',
    'avg',
    'min',
    'max',
    'count_distinct',
] as const satisfies readonly Aggregate[];

export const valueFormats = [
    'number',
    'rub',
    'usd',
    'percent',
] as const satisfies readonly MeasureValueFormat[];

export const filterOperations = [
    'eq',
    'neq',
    'in',
    'nin',
    'gt',
    'gte',
    'lt',
    'lte',
    'between',
    'is_null',
    'not_null',
] as const satisfies readonly FilterOperation[];

export const timeGranularities = [
    'day',
    'week',
    'month',
    'quarter',
    'year',
] as const satisfies readonly TimeGranularity[];

export const chartRowLimit = 200;

export const chartTypeLabels: Record<ChartType, string> = {
    bar: 'Bar',
    line: 'Line',
    pie: 'Pie',
    heatmap: 'Heatmap',
};

export const groupingLabels: Record<GroupingMode, string> = {
    none: 'None',
    time: 'By time',
    numeric: 'By range',
};
