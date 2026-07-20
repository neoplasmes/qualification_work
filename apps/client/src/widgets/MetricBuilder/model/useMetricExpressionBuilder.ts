import { useEffect, useMemo, useRef, useState } from 'react';

import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import type { ConfigBind } from '@/shared/ui/tools/Config';

import {
    buildMetricExpression,
    buildMetricName,
    getMetricExpressionColumns,
    parseMetricBuilderExpression,
    type MetricAggregate,
    type MetricExpressionMode,
} from '../lib';
import type { MetricBuilderDraft } from './metricBuilderConfig';

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

const findAnalyzableColumn = (columns: DatasetColumn[], columnId: string) =>
    columns.find(column => column.id === columnId && column.isAnalyzable !== false);

const findFirstAnalyzableColumn = (columns: DatasetColumn[]) =>
    columns.find(column => column.isAnalyzable !== false);

const findColumnByParsedExpression = (
    columns: DatasetColumn[],
    aggregate: MetricAggregate,
    columnKey: string
) =>
    getMetricExpressionColumns(columns, aggregate).find(
        column => column.key === columnKey && column.isAnalyzable !== false
    );

const resolveMetricBuilderState = (
    expression: string,
    columns: DatasetColumn[]
): MetricBuilderState | null => {
    const parsed = parseMetricBuilderExpression(expression);

    if (!parsed) {
        return null;
    }

    const column = findColumnByParsedExpression(
        columns,
        parsed.aggregate,
        parsed.columnKey
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
    const savedBuilderState = useMemo(
        () => resolveMetricBuilderState(metricExpression, columns),
        [columns, metricExpression]
    );
    const activeAggregate =
        expressionMode === 'builder' && savedBuilderState
            ? savedBuilderState.aggregate
            : aggregate;
    const preferredColumnId =
        expressionMode === 'builder' && savedBuilderState
            ? savedBuilderState.columnId
            : columnId;
    const expressionColumns = useMemo(
        () => getMetricExpressionColumns(columns, activeAggregate),
        [activeAggregate, columns]
    );
    const activeColumnId =
        findAnalyzableColumn(expressionColumns, preferredColumnId)?.id ??
        findFirstAnalyzableColumn(expressionColumns)?.id ??
        '';
    const activeColumn = expressionColumns.find(column => column.id === activeColumnId);
    const builtExpression = buildMetricExpression(activeAggregate, activeColumn);
    const builtMetricName = buildMetricName(activeAggregate, activeColumn);
    const aggregateBind = useMemo<ConfigBind<MetricBuilderDraft, MetricAggregate>>(
        () => ({
            get: draft =>
                parseMetricBuilderExpression(draft.expression)?.aggregate ??
                activeAggregate,
            set: (draft, nextAggregate) => {
                const nextColumns = getMetricExpressionColumns(columns, nextAggregate);
                const nextColumn =
                    findAnalyzableColumn(nextColumns, activeColumnId) ??
                    findFirstAnalyzableColumn(nextColumns);

                draft.expression = buildMetricExpression(nextAggregate, nextColumn);
            },
        }),
        [activeAggregate, activeColumnId, columns]
    );
    const columnIdBind = useMemo<ConfigBind<MetricBuilderDraft, string>>(
        () => ({
            get: draft => {
                const parsed = parseMetricBuilderExpression(draft.expression);

                if (!parsed) {
                    return activeColumnId;
                }

                return (
                    findColumnByParsedExpression(
                        columns,
                        parsed.aggregate,
                        parsed.columnKey
                    )?.id ?? activeColumnId
                );
            },
            set: (draft, nextColumnId) => {
                const nextColumn = findAnalyzableColumn(expressionColumns, nextColumnId);

                draft.expression = buildMetricExpression(activeAggregate, nextColumn);
            },
        }),
        [activeAggregate, activeColumnId, columns, expressionColumns]
    );

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

    const markFormulaExpressionChange = () => {
        skipExternalSyncRef.current = true;
    };

    return {
        aggregateBind,
        builtExpression,
        builtMetricName,
        columnIdBind,
        expressionColumns,
        expressionMode,
        setExpressionMode,
        markFormulaExpressionChange,
    };
};
