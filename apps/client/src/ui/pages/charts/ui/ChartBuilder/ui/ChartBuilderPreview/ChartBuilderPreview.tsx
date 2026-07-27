import type { ChartConfig, ChartData as ChartResponse } from '@/core/entities/chart';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { ChartConfigSummary } from '@/ui/widgets/ChartConfigSummary';
import { ChartShell } from '@/ui/widgets/ChartShell';
import { Field, Input } from '@qualification-work/design-system';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { StatusMessage } from '@/shared/ui';

import { type ChartBuilderOutput } from '../../model';

type ChartBuilderPreviewProps = {
    chartError: string;
    columns: DatasetColumn[];
    editMode: boolean;
    output: ChartBuilderOutput;
    previewConfig: ChartConfig;
    previewData: ChartResponse;
    selectedDataset: DatasetMetadata;
    onChartNameChange: (chartName: string) => void;
};

export const ChartBuilderPreview = ({
    chartError,
    columns,
    editMode,
    output,
    previewConfig,
    previewData,
    selectedDataset,
    onChartNameChange,
}: ChartBuilderPreviewProps) => (
    <>
        <div data-stack="h" data-gap="sm" data-align="center">
            Предпросмотр
        </div>
        <div data-stack="v" data-gap="sm">
            {!editMode && (
                <Field label="Название графика">
                    <Input
                        value={output.chartName}
                        placeholder={`${selectedDataset.dataset.name} ${output.chartType}`}
                        onChange={event => onChartNameChange(event.target.value)}
                    />
                </Field>
            )}

            <ChartShell
                data={previewData}
                kind={previewData.kind}
                ariaLabel="Предпросмотр графика"
                color={output.chartColor}
                barsLimit={8}
                showResultSummary={false}
            />

            <ChartConfigSummary
                chartType={output.chartType}
                config={previewConfig}
                columns={columns}
            />

            {chartError && <StatusMessage tone="error">{chartError}</StatusMessage>}
        </div>
    </>
);
