import type { ChartConfig, ChartResponse } from '@qualification-work/types';

import { ChartConfigSummary, ChartShell } from '@/entities/chart';
import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import { FormField, StatusMessage, TextInput } from '@/shared/ui';

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
            Preview
        </div>
        <div data-stack="v" data-gap="sm">
            {!editMode && (
                <FormField label="Chart name">
                    <TextInput
                        value={output.chartName}
                        placeholder={`${selectedDataset.dataset.name} ${output.chartType}`}
                        onChange={event => onChartNameChange(event.target.value)}
                    />
                </FormField>
            )}

            <ChartShell
                data={previewData}
                kind={previewData.kind}
                ariaLabel="Chart preview"
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
