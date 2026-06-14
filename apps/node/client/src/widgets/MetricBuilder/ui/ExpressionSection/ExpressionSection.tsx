import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { FormField, SegmentedControl, type SegmentedControlOption } from '@/shared/ui';

import { metricBuilderTestIds } from '../../const';
import { metricAggregateOptions, type MetricExpressionMode } from '../../lib';
import {
    metricBuilderBinds,
    metricBuilderConfig,
    useMetricExpressionBuilder,
    useMetricPreview,
} from '../../model';

import styles from './ExpressionSection.module.scss';

const metricExpressionModeOptions: readonly SegmentedControlOption<MetricExpressionMode>[] =
    [
        { value: 'builder', label: 'Builder' },
        { value: 'formula', label: 'Formula' },
    ];

type ExpressionSectionProps = {
    datasets: DatasetMetadata[] | undefined;
    isMetricNameDirty: boolean;
    onBuilderMetricNameChange: (value: string) => void;
};

export const ExpressionSection = ({
    datasets,
    isMetricNameDirty,
    onBuilderMetricNameChange,
}: ExpressionSectionProps) => {
    const lastAutoMetricNameRef = useRef('');
    const datasetIdInput = metricBuilderConfig.useInput(metricBuilderBinds.datasetId);
    const expressionInput = metricBuilderConfig.useInput(metricBuilderBinds.expression);
    const nameInput = metricBuilderConfig.useInput(metricBuilderBinds.name);
    const formatInput = metricBuilderConfig.useInput(metricBuilderBinds.format);

    const valueMultiplierInput = metricBuilderConfig.useInput(
        metricBuilderBinds.valueMultiplier
    );
    const selectedDataset = useMemo(
        () => datasets?.find(item => item.dataset.id === datasetIdInput.value) ?? null,
        [datasets, datasetIdInput.value]
    );
    const {
        aggregateBind,
        builtExpression,
        builtMetricName,
        columnIdBind,
        expressionColumns,
        expressionMode,
        setExpressionMode,
        markFormulaExpressionChange,
    } = useMetricExpressionBuilder({
        selectedDataset,
        datasetId: datasetIdInput.value,
        metricExpression: expressionInput.value,
        onExpressionChange: expressionInput.setValue,
    });
    const previewExpression = (
        expressionMode === 'builder' ? builtExpression : expressionInput.value
    ).trim();
    const metricPreview = useMetricPreview({
        datasetId: datasetIdInput.value,
        expression: previewExpression,
        format: formatInput.value,
        valueMultiplier: valueMultiplierInput.value,
    });

    const metricPreviewClassName = metricPreview.isMuted
        ? styles['preview-muted']
        : styles['preview-value'];

    useEffect(() => {
        onBuilderMetricNameChange(builtMetricName);
    }, [builtMetricName, onBuilderMetricNameChange]);

    useEffect(() => {
        if (expressionMode !== 'builder') {
            return;
        }

        const previousAutoMetricName = lastAutoMetricNameRef.current;
        const shouldUseAutoName =
            !isMetricNameDirty &&
            (!nameInput.value.trim() || nameInput.value === previousAutoMetricName);

        lastAutoMetricNameRef.current = builtMetricName;

        if (builtMetricName && shouldUseAutoName && nameInput.value !== builtMetricName) {
            nameInput.setValue(builtMetricName);
        }
    }, [
        builtMetricName,
        expressionMode,
        isMetricNameDirty,
        nameInput.value,
        nameInput.setValue,
    ]);

    const metricPreviewField = (
        <FormField label="Preview" className={styles['preview-field']}>
            <div
                className={[styles['preview'], metricPreviewClassName].join(' ')}
                data-stack="h"
                data-align="center"
                data-px="sm"
                data-test-id={metricBuilderTestIds.previewValue}
                title={metricPreview.content}
            >
                {metricPreview.content}
            </div>
        </FormField>
    );
    const expressionRow = (
        <div className={styles['expression-row']}>
            <FormField label="Expression" data-flex>
                <metricBuilderConfig.Input
                    bind={metricBuilderBinds.expression}
                    data-test-id={metricBuilderTestIds.expressionInput}
                    placeholder="avg(score)"
                    readOnly={expressionMode === 'builder'}
                    visuallyDisabled={expressionMode === 'builder'}
                    onValueChange={
                        expressionMode === 'builder'
                            ? undefined
                            : markFormulaExpressionChange
                    }
                />
            </FormField>
            {metricPreviewField}
        </div>
    );

    let expressionContent: ReactNode;

    if (expressionMode === 'builder') {
        expressionContent = (
            <>
                <FormField label="Operation">
                    <metricBuilderConfig.Select
                        bind={aggregateBind}
                        data-test-id={metricBuilderTestIds.aggregateSelect}
                    >
                        {metricAggregateOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </metricBuilderConfig.Select>
                </FormField>
                <FormField label="Column">
                    <metricBuilderConfig.Select
                        bind={columnIdBind}
                        data-test-id={metricBuilderTestIds.columnSelect}
                        disabled={
                            !expressionColumns.some(
                                column => column.isAnalyzable !== false
                            )
                        }
                    >
                        {expressionColumns.map(column => (
                            <option
                                key={column.id}
                                value={column.id}
                                disabled={column.isAnalyzable === false}
                            >
                                {column.displayName}
                            </option>
                        ))}
                    </metricBuilderConfig.Select>
                </FormField>
                {expressionRow}
            </>
        );
    } else {
        expressionContent = expressionRow;
    }

    return (
        <metricBuilderConfig.Section name="Expression" className={styles['section']}>
            <FormField label="Mode">
                <div data-test-id={metricBuilderTestIds.expressionModeSelect}>
                    <SegmentedControl
                        className={styles['mode-control']}
                        value={expressionMode}
                        options={metricExpressionModeOptions}
                        ariaLabel="Metric expression mode"
                        onChange={setExpressionMode}
                    />
                </div>
            </FormField>
            {expressionContent}
        </metricBuilderConfig.Section>
    );
};
