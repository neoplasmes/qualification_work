import { Database, X } from 'lucide-react';

import { configToBuilderFields, DatasetChartBuilder } from '@/features/buildChart';

import type { Chart } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { Button } from '@/shared/ui';

import { chartsTestIds } from '../../../const';

import styles from './ChartBuilderSection.module.scss';

type CreateChartBuilderSectionProps = {
    orgId: string;
    dataset: DatasetMetadata;
    onChangeDataset: () => void;
    onCancel: () => void;
    onChartCreated: (chartId: string) => void;
};

type EditChartBuilderSectionProps = {
    orgId: string;
    chart: Chart;
    dataset: DatasetMetadata;
    onChartUpdated: () => void;
};

export const CreateChartBuilderSection = ({
    orgId,
    dataset,
    onChangeDataset,
    onCancel,
    onChartCreated,
}: CreateChartBuilderSectionProps) => (
    <>
        <div className={styles['builder-header']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>New chart</span>
                <h2 className={styles['title']}>{dataset.dataset.name}</h2>
            </div>
            <div data-stack="h" data-gap="sm" data-align="center">
                <Button
                    data-test-id={chartsTestIds.changeDatasetButton}
                    onClick={onChangeDataset}
                >
                    <Database size={18} aria-hidden />
                    Change dataset
                </Button>
                <Button
                    data-test-id={chartsTestIds.cancelCreateButton}
                    onClick={onCancel}
                >
                    <X size={18} aria-hidden />
                    Cancel
                </Button>
            </div>
        </div>
        <DatasetChartBuilder
            key={dataset.dataset.id}
            orgId={orgId}
            selectedDataset={dataset}
            onChartCreated={onChartCreated}
        />
    </>
);

export const EditChartBuilderSection = ({
    orgId,
    chart,
    dataset,
    onChartUpdated,
}: EditChartBuilderSectionProps) => (
    <DatasetChartBuilder
        key={`edit-${chart.id}`}
        orgId={orgId}
        selectedDataset={dataset}
        editChartId={chart.id}
        initialFields={configToBuilderFields(chart.config, chart.chartType)}
        onChartUpdated={onChartUpdated}
    />
);
