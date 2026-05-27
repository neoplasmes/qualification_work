import type { FormEvent } from 'react';

import type { DashboardMetricItem } from '@/entities/dashboard';
import type { DatasetMetadata } from '@/entities/dataset';

import { Modal } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import { AddMetricForm } from '../AddMetricForm';

type AddMetricModalProps = {
    datasets: DatasetMetadata[] | undefined;
    datasetId: string;
    metricName: string;
    metricExpression: string;
    metricFormat: DashboardMetricItem['format'];
    error?: string;
    disabled: boolean;
    /** when true, modal title and submit label reflect editing flow */
    editing?: boolean;
    onDatasetChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onExpressionChange: (value: string) => void;
    onFormatChange: (value: DashboardMetricItem['format']) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
};

export const AddMetricModal = ({
    datasets,
    datasetId,
    metricName,
    metricExpression,
    metricFormat,
    error,
    disabled,
    editing,
    onDatasetChange,
    onNameChange,
    onExpressionChange,
    onFormatChange,
    onSubmit,
    onClose,
}: AddMetricModalProps) => (
    <Modal
        title={editing ? 'Edit metric' : 'Add metric'}
        testId={dashboardsTestIds.addMetricModal}
        size="md"
        onClose={onClose}
    >
        <AddMetricForm
            datasets={datasets}
            datasetId={datasetId}
            metricName={metricName}
            metricExpression={metricExpression}
            metricFormat={metricFormat}
            error={error}
            disabled={disabled}
            editing={editing}
            onDatasetChange={onDatasetChange}
            onNameChange={onNameChange}
            onExpressionChange={onExpressionChange}
            onFormatChange={onFormatChange}
            onSubmit={onSubmit}
        />
    </Modal>
);
