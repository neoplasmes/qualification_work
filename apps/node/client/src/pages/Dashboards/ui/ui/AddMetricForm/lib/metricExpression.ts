import type { DatasetColumn } from '@/entities/dataset';

export type MetricExpressionMode = 'builder' | 'formula';
export type MetricAggregate = 'avg' | 'sum' | 'min' | 'max' | 'count';
export type ParsedMetricBuilderExpression = {
    aggregate: MetricAggregate;
    columnKey: string;
};

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

const metricIdentifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const metricBuilderExpressionPattern = /^\s*(avg|sum|min|max|count)\s*\(([\s\S]*)\)\s*$/i;
const legacyMetricColumnPattern = /^[^,()+\-*/%]+$/u;

export const formatMetricColumnRef = (columnKey: string) =>
    metricIdentifierPattern.test(columnKey) ? columnKey : JSON.stringify(columnKey);

export const parseMetricColumnRef = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (metricIdentifierPattern.test(trimmed)) {
        return trimmed;
    }

    try {
        const parsed = JSON.parse(trimmed) as unknown;

        if (typeof parsed === 'string' && parsed.trim()) {
            return parsed;
        }
    } catch {
        // legacy metric expressions stored raw column keys without quotes
    }

    return legacyMetricColumnPattern.test(trimmed) ? trimmed : null;
};

export const parseMetricBuilderExpression = (
    expression: string
): ParsedMetricBuilderExpression | null => {
    const match = metricBuilderExpressionPattern.exec(expression);
    if (!match) {
        return null;
    }

    const columnKey = parseMetricColumnRef(match[2]);
    if (!columnKey) {
        return null;
    }

    return {
        aggregate: match[1].toLowerCase() as MetricAggregate,
        columnKey,
    };
};

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

    return `${aggregate}(${formatMetricColumnRef(column.key)})`;
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
