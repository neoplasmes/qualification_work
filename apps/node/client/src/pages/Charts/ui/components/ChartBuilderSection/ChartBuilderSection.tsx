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
    onChartCreated: (chartId: string) => void;
};

type EditChartBuilderSectionProps = {
    orgId: string;
    chart: Chart;
    dataset: DatasetMetadata;
    onCancel: () => void;
    onChartUpdated: () => void;
};

export const CreateChartBuilderSection = ({
    orgId,
    dataset,
    onChangeDataset,
    onChartCreated,
}: CreateChartBuilderSectionProps) => (
    <>
        <div className={styles['builder-header']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>New chart</span>
                <h2 className={styles['title']}>{dataset.dataset.name}</h2>
            </div>
            <Button
                data-test-id={chartsTestIds.changeDatasetButton}
                onClick={onChangeDataset}
            >
                Change dataset
            </Button>
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
    onCancel,
    onChartUpdated,
}: EditChartBuilderSectionProps) => (
    <>
        <div className={styles['builder-header']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Edit chart</span>
                <h2 className={styles['title']}>{chart.name}</h2>
            </div>
            <Button data-test-id={chartsTestIds.cancelEditButton} onClick={onCancel}>
                Cancel
            </Button>
        </div>
        <DatasetChartBuilder
            key={`edit-${chart.id}`}
            orgId={orgId}
            selectedDataset={dataset}
            editChartId={chart.id}
            initialFields={configToBuilderFields(chart.config, chart.chartType)}
            onChartUpdated={onChartUpdated}
        />
    </>
);
