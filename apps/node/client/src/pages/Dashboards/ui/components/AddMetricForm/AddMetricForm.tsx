import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import type { DashboardMetricItem } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import { Button, FormField, Select, TextInput } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import { DashboardFormSection } from '../DashboardFormSection';
import {
    buildMetricExpression,
    getMetricExpressionColumns,
    metricAggregateOptions,
    metricExpressionModeOptions,
    type MetricAggregate,
    type MetricExpressionMode,
} from './lib';

import styles from './AddMetricForm.module.scss';

type AddMetricFormProps = {
    datasets: DatasetMetadata[] | undefined;
    datasetId: string;
    metricName: string;
    metricExpression: string;
    metricFormat: DashboardMetricItem['format'];
    disabled: boolean;
    onDatasetChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onExpressionChange: (value: string) => void;
    onFormatChange: (value: DashboardMetricItem['format']) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const AddMetricForm = ({
    datasets,
    datasetId,
    metricName,
    metricExpression,
    metricFormat,
    disabled,
    onDatasetChange,
    onNameChange,
    onExpressionChange,
    onFormatChange,
    onSubmit,
}: AddMetricFormProps) => {
    const [expressionMode, setExpressionMode] = useState<MetricExpressionMode>('builder');
    const [aggregate, setAggregate] = useState<MetricAggregate>('avg');
    const [columnId, setColumnId] = useState('');

    const selectedDataset = useMemo(
        () => datasets?.find(item => item.dataset.id === datasetId) ?? null,
        [datasets, datasetId]
    );
    const expressionColumns = useMemo(
        () => getMetricExpressionColumns(selectedDataset?.columns ?? [], aggregate),
        [aggregate, selectedDataset?.columns]
    );
    const activeColumnId = expressionColumns.some(column => column.id === columnId)
        ? columnId
        : (expressionColumns[0]?.id ?? '');
    const activeColumn = expressionColumns.find(column => column.id === activeColumnId);
    const builtExpression = buildMetricExpression(aggregate, activeColumn);

    useEffect(() => {
        if (expressionMode === 'builder' && metricExpression !== builtExpression) {
            onExpressionChange(builtExpression);
        }
    }, [builtExpression, expressionMode, metricExpression, onExpressionChange]);

    return (
        <form
            className={styles['form']}
            data-test-id={dashboardsTestIds.addMetricForm}
            aria-label="Add metric"
            onSubmit={onSubmit}
        >
            <DashboardFormSection>Metrics</DashboardFormSection>
            <FormField label="Dataset">
                <Select
                    data-test-id={dashboardsTestIds.metricDatasetSelect}
                    value={datasetId}
                    onChange={event => onDatasetChange(event.target.value)}
                >
                    {datasets?.map(item => (
                        <option key={item.dataset.id} value={item.dataset.id}>
                            {item.dataset.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            <FormField label="Metric name">
                <TextInput
                    data-test-id={dashboardsTestIds.metricNameInput}
                    value={metricName}
                    placeholder="Average score"
                    onChange={event => onNameChange(event.target.value)}
                />
            </FormField>
            <FormField label="Format">
                <Select
                    data-test-id={dashboardsTestIds.metricFormatSelect}
                    value={metricFormat}
                    onChange={event =>
                        onFormatChange(
                            event.target.value as DashboardMetricItem['format']
                        )
                    }
                >
                    <option value="number">number</option>
                    <option value="currency">currency</option>
                    <option value="percent">percent</option>
                </Select>
            </FormField>

            <DashboardFormSection>Expression</DashboardFormSection>
            <FormField label="Mode">
                <Select
                    data-test-id={dashboardsTestIds.metricExpressionModeSelect}
                    value={expressionMode}
                    onChange={event =>
                        setExpressionMode(event.target.value as MetricExpressionMode)
                    }
                >
                    {metricExpressionModeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </FormField>

            {expressionMode === 'builder' ? (
                <>
                    <FormField label="Operation">
                        <Select
                            data-test-id={dashboardsTestIds.metricAggregateSelect}
                            value={aggregate}
                            onChange={event =>
                                setAggregate(event.target.value as MetricAggregate)
                            }
                        >
                            {metricAggregateOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Column">
                        <Select
                            data-test-id={dashboardsTestIds.metricColumnSelect}
                            value={activeColumnId}
                            onChange={event => setColumnId(event.target.value)}
                            disabled={expressionColumns.length === 0}
                        >
                            {expressionColumns.map(column => (
                                <option key={column.id} value={column.id}>
                                    {column.displayName}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Expression" className={styles['wide']}>
                        <TextInput
                            data-test-id={dashboardsTestIds.metricExpressionInput}
                            value={builtExpression}
                            placeholder="avg(score)"
                            readOnly
                        />
                    </FormField>
                </>
            ) : (
                <FormField label="Formula" className={styles['wide']}>
                    <TextInput
                        data-test-id={dashboardsTestIds.metricExpressionInput}
                        value={metricExpression}
                        placeholder="avg(score)"
                        onChange={event => onExpressionChange(event.target.value)}
                    />
                </FormField>
            )}

            <Button
                type="submit"
                className={styles['submit']}
                data-test-id={dashboardsTestIds.addMetricButton}
                disabled={!datasetId || !metricExpression.trim() || disabled}
            >
                <Plus size={18} />
                Add metric
            </Button>
        </form>
    );
};
