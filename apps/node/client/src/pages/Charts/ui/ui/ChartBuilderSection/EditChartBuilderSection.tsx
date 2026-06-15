import type { Chart } from '@qualification-work/types';

import {
    ChartBuilder,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
} from '@/widgets/ChartBuilder';

import type { DatasetMetadata } from '@/entities/dataset';

type EditChartBuilderSectionProps = {
    orgId: string;
    chart: Chart;
    dataset: DatasetMetadata;
    draft: ChartBuilderDraft;
    actionsContainer?: HTMLElement | null;
    onDraftChange: (draft: ChartBuilderDraft) => void;
    onOutputChange: (output: ChartBuilderOutput) => void;
    onChartUpdated: (chartId: string) => void;
};

export const EditChartBuilderSection = ({
    orgId,
    chart,
    dataset,
    draft,
    actionsContainer,
    onDraftChange,
    onOutputChange,
    onChartUpdated,
}: EditChartBuilderSectionProps) => (
    <ChartBuilder
        key={`edit-${chart.id}`}
        orgId={orgId}
        selectedDataset={dataset}
        editChartId={chart.id}
        value={draft}
        actionsContainer={actionsContainer}
        onChange={onDraftChange}
        onOutputChange={onOutputChange}
        onChartUpdated={onChartUpdated}
    />
);
