import { skipToken } from '@reduxjs/toolkit/query';
import { Save } from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';

import { usePreviewDashboardMetricQuery } from '@/features/manageDashboards';

import type { DashboardMetricItem } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import {
    Button,
    Explain,
    FormField,
    SegmentedControl,
    Select,
    StatusMessage,
    Switch,
    TextInput,
} from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import type { MetricConfigForm } from '../../lib';
import { DashboardFormSection } from '../DashboardFormSection';
import {
    buildMetricExpression,
    buildMetricName,
    getMetricExpressionColumns,
    metricAggregateOptions,
    metricExpressionModeOptions,
    type MetricAggregate,
    type MetricExpressionMode,
} from './lib';
import { MetricGoalFields, MetricPreview, MetricTrendFields } from './ui';

import styles from './AddMetricForm.module.scss';

type AddMetricFormProps = {
    datasets: DatasetMetadata[] | undefined;
    datasetId: string;
    metricName: string;
    metricExpression: string;
    metricFormat: DashboardMetricItem['format'];
    config: MetricConfigForm;
    error?: string;
    disabled: boolean;
    editing?: boolean;
    onDatasetChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onExpressionChange: (value: string) => void;
    onFormatChange: (value: DashboardMetricItem['format']) => void;
    onConfigChange: (patch: Partial<MetricConfigForm>) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const AddMetricForm = ({
    datasets,
    datasetId,
    metricName,
    metricExpression,
    metricFormat,
    config,
    error,
    disabled,
    editing,
    onDatasetChange,
    onNameChange,
    onExpressionChange,
    onFormatChange,
    onConfigChange,
    onSubmit,
}: AddMetricFormProps) => {
    const [expressionMode, setExpressionMode] = useState<MetricExpressionMode>('builder');
    const [aggregate, setAggregate] = useState<MetricAggregate>('avg');
    const [columnId, setColumnId] = useState('');
    const [isMetricNameDirty, setIsMetricNameDirty] = useState(false);
    const lastAutoMetricNameRef = useRef('');

    const selectedDataset = useMemo(
        () => datasets?.find(item => item.dataset.id === datasetId) ?? null,
        [datasets, datasetId]
    );
    const expressionColumns = useMemo(
        () => getMetricExpressionColumns(selectedDataset?.columns ?? [], aggregate),
        [aggregate, selectedDataset?.columns]
    );
    const dateColumns = useMemo(
        () =>
            (selectedDataset?.columns ?? []).filter(column => column.dataType === 'date'),
        [selectedDataset?.columns]
    );
    const activeColumnId = expressionColumns.some(
        column => column.id === columnId && column.isAnalyzable !== false
    )
        ? columnId
        : (expressionColumns.find(column => column.isAnalyzable !== false)?.id ?? '');
    const activeColumn = expressionColumns.find(column => column.id === activeColumnId);
    const builtExpression = buildMetricExpression(aggregate, activeColumn);
    const builtMetricName = buildMetricName(aggregate, activeColumn);
    const targetMetricName = metricName.trim() || builtMetricName;
    const previewExpression = (
        expressionMode === 'builder' ? builtExpression : metricExpression
    ).trim();
    const previewEnabled = Boolean(datasetId && previewExpression);
    const previewPayload = useMemo(
        () => (previewEnabled ? { datasetId, expression: previewExpression } : skipToken),
        [datasetId, previewEnabled, previewExpression]
    );
    const metricPreview = usePreviewDashboardMetricQuery(previewPayload);

    useEffect(() => {
        if (expressionMode === 'builder' && metricExpression !== builtExpression) {
            onExpressionChange(builtExpression);
        }
    }, [builtExpression, expressionMode, metricExpression, onExpressionChange]);

    useEffect(() => {
        if (expressionMode !== 'builder') {
            return;
        }

        const previousAutoMetricName = lastAutoMetricNameRef.current;
        const shouldUseAutoName =
            !isMetricNameDirty &&
            (!metricName.trim() || metricName === previousAutoMetricName);

        lastAutoMetricNameRef.current = builtMetricName;

        if (builtMetricName && shouldUseAutoName && metricName !== builtMetricName) {
            onNameChange(builtMetricName);
        }
    }, [builtMetricName, expressionMode, isMetricNameDirty, metricName, onNameChange]);

    const metricPreviewContent = (
        <FormField label="Preview" className={styles['preview-field']}>
            <MetricPreview
                dataTestId={dashboardsTestIds.metricPreviewValue}
                enabled={previewEnabled}
                error={metricPreview.error}
                format={metricFormat}
                isFetching={metricPreview.isFetching}
                value={metricPreview.data?.value}
            />
        </FormField>
    );

    let expressionContent: ReactNode;

    if (expressionMode === 'builder') {
        expressionContent = (
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
                    </Select>
                </FormField>
                <div className={styles['expression-row']}>
                    <FormField label="Expression" className={styles['expression-field']}>
                        <TextInput
                            data-test-id={dashboardsTestIds.metricExpressionInput}
                            value={builtExpression}
                            placeholder="avg(score)"
                            readOnly
                        />
                    </FormField>
                    {metricPreviewContent}
                </div>
            </>
        );
    } else {
        expressionContent = (
            <div className={styles['expression-row']}>
                <FormField label="Expression" className={styles['expression-field']}>
                    <TextInput
                        data-test-id={dashboardsTestIds.metricExpressionInput}
                        value={metricExpression}
                        placeholder="avg(score)"
                        onChange={event => onExpressionChange(event.target.value)}
                    />
                </FormField>
                {metricPreviewContent}
            </div>
        );
    }

    return (
        <form
            className={styles['form']}
            data-test-id={dashboardsTestIds.addMetricForm}
            aria-label={editing ? 'Edit metric' : 'Add metric'}
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
                    placeholder={builtMetricName || 'Average score'}
                    onChange={event => {
                        setIsMetricNameDirty(true);
                        onNameChange(event.target.value);
                    }}
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
            <FormField label="Mode" className={styles['mode-field']}>
                <div data-test-id={dashboardsTestIds.metricExpressionModeSelect}>
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

            <DashboardFormSection>Goal</DashboardFormSection>
            <MetricGoalFields
                config={config}
                metricName={targetMetricName}
                onConfigChange={onConfigChange}
            />

            <DashboardFormSection
                action={
                    <Switch
                        aria-label="Show trend"
                        checked={config.showTrend}
                        onChange={event =>
                            onConfigChange({ showTrend: event.target.checked })
                        }
                    />
                }
            >
                <span className={styles['section-label-with-explain']}>
                    Trend
                    <Explain
                        label="Explain trend"
                        description="Show a sparkline of the value over time."
                    />
                </span>
            </DashboardFormSection>
            <MetricTrendFields
                config={config}
                dateColumns={dateColumns}
                onConfigChange={onConfigChange}
            />

            {error && (
                <StatusMessage tone="error" className={styles['error']}>
                    {error}
                </StatusMessage>
            )}

            <Button
                type="submit"
                className={styles['submit']}
                data-pr="none"
                data-test-id={dashboardsTestIds.addMetricButton}
                disabled={!datasetId || !metricExpression.trim() || disabled}
            >
                <Save size={18} />
                Save
            </Button>
        </form>
    );
};
