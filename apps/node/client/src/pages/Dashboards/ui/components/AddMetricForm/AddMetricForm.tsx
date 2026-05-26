import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';

import type { DashboardMetricItem } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import { Button, FormField, Select, TextInput } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

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
}: AddMetricFormProps) => (
    <form
        className={styles['add-chart']}
        data-test-id={dashboardsTestIds.addMetricForm}
        aria-label="Add metric"
        onSubmit={onSubmit}
    >
        <FormField label="Metric dataset">
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
        <FormField label="Expression">
            <TextInput
                data-test-id={dashboardsTestIds.metricExpressionInput}
                value={metricExpression}
                placeholder="avg(score)"
                onChange={event => onExpressionChange(event.target.value)}
            />
        </FormField>
        <FormField label="Format">
            <Select
                data-test-id={dashboardsTestIds.metricFormatSelect}
                value={metricFormat}
                onChange={event =>
                    onFormatChange(event.target.value as DashboardMetricItem['format'])
                }
            >
                <option value="number">number</option>
                <option value="currency">currency</option>
                <option value="percent">percent</option>
            </Select>
        </FormField>
        <Button
            type="submit"
            data-test-id={dashboardsTestIds.addMetricButton}
            disabled={!datasetId || disabled}
        >
            <Plus size={18} />
            Add metric
        </Button>
    </form>
);
