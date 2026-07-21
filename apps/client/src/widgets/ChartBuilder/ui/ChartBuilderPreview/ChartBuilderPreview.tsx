import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { Field, Input } from '@qualification-work/design-system';
import type { ChartConfig, ChartResponse } from '@qualification-work/types';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { ChartConfigSummary, ChartShell } from '@/entities/chart';

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
            Preview
        </div>
        <div data-stack="v" data-gap="sm">
            {!editMode && (
                <Field label="Chart name">
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
