import { configToBuilderFields, DatasetChartBuilder } from '@/features/buildChart';

import type { Chart } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { Button, EntityHeader } from '@/shared/ui';

import { chartsTestIds } from '../../../const';

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
        <EntityHeader
            eyebrow="New chart"
            title={dataset.dataset.name}
            actions={
                <Button
                    data-test-id={chartsTestIds.changeDatasetButton}
                    onClick={onChangeDataset}
                >
                    Change dataset
                </Button>
            }
        />
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
        <EntityHeader
            eyebrow="Edit chart"
            title={chart.name}
            actions={
                <Button data-test-id={chartsTestIds.cancelEditButton} onClick={onCancel}>
                    Cancel
                </Button>
            }
        />
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
