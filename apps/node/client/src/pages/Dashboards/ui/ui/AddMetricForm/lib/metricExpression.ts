import type { DatasetColumn } from '@/entities/dataset';

export type MetricExpressionMode = 'builder' | 'formula';
export type MetricAggregate = 'avg' | 'sum' | 'min' | 'max' | 'count';

export const metricExpressionModeOptions = [
    { value: 'builder', label: 'Builder' },
    { value: 'formula', label: 'Formula' },
] as const satisfies readonly { value: MetricExpressionMode; label: string }[];

export const metricAggregateOptions = [
    { value: 'avg', label: 'Average' },
    { value: 'sum', label: 'Sum' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'count', label: 'Count' },
] as const satisfies readonly { value: MetricAggregate; label: string }[];

const metricAggregateLabels: Record<MetricAggregate, string> = Object.fromEntries(
    metricAggregateOptions.map(option => [option.value, option.label])
) as Record<MetricAggregate, string>;

export const getMetricExpressionColumns = (
    columns: DatasetColumn[],
    aggregate: MetricAggregate
) => {
    if (aggregate === 'count') {
        return columns;
    }

    return columns.filter(column => column.dataType === 'number');
};

export const buildMetricExpression = (
    aggregate: MetricAggregate,
    column: DatasetColumn | undefined
) => {
    if (!column) {
        return '';
    }

    return `${aggregate}(${column.key})`;
};

export const buildMetricName = (
    aggregate: MetricAggregate,
    column: DatasetColumn | undefined
) => {
    if (!column) {
        return '';
    }

    return `${metricAggregateLabels[aggregate]} ${column.displayName || column.key}`;
};
