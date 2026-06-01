import { useEffect, useMemo, useRef, useState } from 'react';

import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import {
    buildMetricExpression,
    buildMetricName,
    getMetricExpressionColumns,
    parseMetricBuilderExpression,
    type MetricAggregate,
    type MetricExpressionMode,
} from './metricExpression';

type MetricBuilderState = {
    aggregate: MetricAggregate;
    columnId: string;
};

type UseMetricExpressionBuilderParams = {
    selectedDataset: DatasetMetadata | null;
    datasetId: string;
    metricExpression: string;
    onExpressionChange: (value: string) => void;
};

const emptyColumns: DatasetColumn[] = [];

const resolveMetricBuilderState = (
    expression: string,
    columns: DatasetColumn[]
): MetricBuilderState | null => {
    const parsed = parseMetricBuilderExpression(expression);
    if (!parsed) {
        return null;
    }

    const expressionColumns = getMetricExpressionColumns(columns, parsed.aggregate);
    const column = expressionColumns.find(
        item => item.key === parsed.columnKey && item.isAnalyzable !== false
    );

    return column ? { aggregate: parsed.aggregate, columnId: column.id } : null;
};

export const useMetricExpressionBuilder = ({
    selectedDataset,
    datasetId,
    metricExpression,
    onExpressionChange,
}: UseMetricExpressionBuilderParams) => {
    const [expressionMode, setExpressionMode] = useState<MetricExpressionMode>('builder');
    const [aggregate, setAggregate] = useState<MetricAggregate>('avg');
    const [columnId, setColumnId] = useState('');
    const skipExternalSyncRef = useRef(false);
    const resolvedExpressionKeyRef = useRef('');

    const columns = selectedDataset?.columns ?? emptyColumns;
    const expressionKey = `${datasetId}\u0000${metricExpression}`;
    const isExternalExpressionResolved =
        !metricExpression.trim() || resolvedExpressionKeyRef.current === expressionKey;
    const expressionColumns = useMemo(
        () => getMetricExpressionColumns(columns, aggregate),
        [aggregate, columns]
    );
    const savedBuilderState = useMemo(
        () => resolveMetricBuilderState(metricExpression, columns),
        [columns, metricExpression]
    );
    const activeColumnId = expressionColumns.some(
        column => column.id === columnId && column.isAnalyzable !== false
    )
        ? columnId
        : (expressionColumns.find(column => column.isAnalyzable !== false)?.id ?? '');
    const activeColumn = expressionColumns.find(column => column.id === activeColumnId);
    const builtExpression = buildMetricExpression(aggregate, activeColumn);
    const builtMetricName = buildMetricName(aggregate, activeColumn);

    useEffect(() => {
        if (skipExternalSyncRef.current) {
            skipExternalSyncRef.current = false;
            resolvedExpressionKeyRef.current = expressionKey;

            return;
        }

        if (!metricExpression.trim()) {
            resolvedExpressionKeyRef.current = expressionKey;
            setExpressionMode('builder');
            setAggregate('avg');
            setColumnId('');

            return;
        }

        if (columns.length === 0) {
            return;
        }

        if (!savedBuilderState) {
            resolvedExpressionKeyRef.current = expressionKey;
            setExpressionMode('formula');

            return;
        }

        resolvedExpressionKeyRef.current = expressionKey;
        setExpressionMode('builder');
        setAggregate(savedBuilderState.aggregate);
        setColumnId(savedBuilderState.columnId);
    }, [columns.length, expressionKey, metricExpression, savedBuilderState]);

    useEffect(() => {
        if (
            expressionMode !== 'builder' ||
            !isExternalExpressionResolved ||
            metricExpression === builtExpression
        ) {
            return;
        }

        skipExternalSyncRef.current = true;
        onExpressionChange(builtExpression);
    }, [
        builtExpression,
        expressionMode,
        isExternalExpressionResolved,
        metricExpression,
        onExpressionChange,
    ]);

    const setFormulaExpression = (value: string) => {
        skipExternalSyncRef.current = true;
        onExpressionChange(value);
    };

    return {
        activeColumnId,
        aggregate,
        builtExpression,
        builtMetricName,
        expressionColumns,
        expressionMode,
        setAggregate,
        setColumnId,
        setExpressionMode,
        setFormulaExpression,
    };
};
