import type { DatasetColumn } from '@/entities/dataset';

export type MetricExpressionMode = 'builder' | 'formula';
export type MetricAggregate = 'avg' | 'sum' | 'min' | 'max' | 'count';
export type ParsedMetricBuilderExpression = {
    aggregate: MetricAggregate;
    columnKey: string;
};

const metricAggregateLabels: Record<MetricAggregate, string> = {
    avg: 'Average',
    sum: 'Sum',
    min: 'Minimum',
    max: 'Maximum',
    count: 'Count',
};

export const metricAggregateOptions = Object.entries(metricAggregateLabels).map(
    ([value, label]) => ({
        value: value as MetricAggregate,
        label,
    })
) as readonly { value: MetricAggregate; label: string }[];

const metricIdentifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const metricBuilderExpressionPattern = /^\s*(avg|sum|min|max|count)\s*\(([\s\S]*)\)\s*$/i;
const legacyMetricColumnPattern = /^[^,()+\-*/%]+$/u;

/**
 * Formats a column key so generated expressions work with simple and special names.
 */
export const formatMetricColumnRef = (columnKey: string) =>
    metricIdentifierPattern.test(columnKey) ? columnKey : JSON.stringify(columnKey);

/**
 * Reads a column reference from saved or typed expressions, including old raw keys.
 */
const parseMetricColumnRef = (value: string): string | null => {
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

/**
 * Detects formulas the visual builder can edit when an existing metric is opened.
 */
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

/**
 * Keeps the column picker focused on fields that fit the selected aggregate.
 */
export const getMetricExpressionColumns = (
    columns: DatasetColumn[],
    aggregate: MetricAggregate
) => {
    if (aggregate === 'count') {
        return columns;
    }

    return columns.filter(column => column.dataType === 'number');
};

/**
 * Creates the formula that the visual builder previews and saves for a metric.
 */
export const buildMetricExpression = (
    aggregate: MetricAggregate,
    column: DatasetColumn | undefined
) => {
    if (!column) {
        return '';
    }

    return `${aggregate}(${formatMetricColumnRef(column.key)})`;
};

/**
 * Creates a clear default name so a new metric starts with a useful label.
 */
export const buildMetricName = (
    aggregate: MetricAggregate,
    column: DatasetColumn | undefined
) => {
    if (!column) {
        return '';
    }

    return `${metricAggregateLabels[aggregate]} ${column.displayName || column.key}`;
};
