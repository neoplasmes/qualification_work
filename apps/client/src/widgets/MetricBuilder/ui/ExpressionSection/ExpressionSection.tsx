import { Field } from '@qualification-work/design-system';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { SegmentedControl, type SegmentedControlOption } from '@/shared/ui';

import { metricBuilderTestIds } from '../../const';
import { metricAggregateOptions, type MetricExpressionMode } from '../../lib';
import {
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
    const datasetIdInput = metricBuilderConfig.useInput('datasetId');
    const expressionInput = metricBuilderConfig.useInput('expression');
    const nameInput = metricBuilderConfig.useInput('name');
    const formatInput = metricBuilderConfig.useInput('format');
    const valueMultiplierInput = metricBuilderConfig.useInput('valueMultiplier');
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
        <Field label="Preview" className={styles['preview-field']}>
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
        </Field>
    );
    const expressionRow = (
        <div className={styles['expression-row']}>
            <Field label="Expression" data-flex>
                <metricBuilderConfig.Input
                    field="expression"
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
            </Field>
            {metricPreviewField}
        </div>
    );

    let expressionContent: ReactNode;

    if (expressionMode === 'builder') {
        expressionContent = (
            <>
                <Field label="Operation">
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
                </Field>
                <Field label="Column">
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
                </Field>
                {expressionRow}
            </>
        );
    } else {
        expressionContent = expressionRow;
    }

    return (
        <metricBuilderConfig.Section name="Expression" className={styles['section']}>
            <Field label="Mode">
                <div data-test-id={metricBuilderTestIds.expressionModeSelect}>
                    <SegmentedControl
                        className={styles['mode-control']}
                        value={expressionMode}
                        options={metricExpressionModeOptions}
                        ariaLabel="Metric expression mode"
                        onChange={setExpressionMode}
                    />
                </div>
            </Field>
            {expressionContent}
        </metricBuilderConfig.Section>
    );
};
