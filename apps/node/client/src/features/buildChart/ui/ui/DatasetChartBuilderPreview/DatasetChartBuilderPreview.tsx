import { ChartConfigSummary, ChartShell } from '@/entities/chart';

import { StatusMessage, TextInput } from '@/shared/ui';

import type { DatasetChartBuilderViewModel } from '../../../model';

import styles from '../../DatasetChartBuilder.module.scss';

type DatasetChartBuilderPreviewProps = {
    model: DatasetChartBuilderViewModel;
};

export const DatasetChartBuilderPreview = ({
    model,
}: DatasetChartBuilderPreviewProps) => (
    <>
        <div
            className={styles['section']}
            data-stack="h"
            data-gap="sm"
            data-align="center"
        >
            Preview
        </div>
        <div data-stack="v" data-gap="sm">
            {!model.editMode && (
                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>Chart name</span>
                    <TextInput
                        value={model.fields.chartName}
                        placeholder={`${model.selectedDataset.dataset.name} ${model.fields.chartType}`}
                        onChange={event => model.fields.setChartName(event.target.value)}
                    />
                </label>
            )}

            {model.previewData && (
                <ChartShell
                    data={model.previewData}
                    kind={model.previewData.kind}
                    ariaLabel="Chart preview"
                    color={model.fields.chartColor}
                    barsLimit={8}
                    showResultSummary={false}
                />
            )}

            {model.savedConfig && (
                <ChartConfigSummary
                    chartType={model.fields.chartType}
                    config={model.savedConfig}
                    columns={model.derived.columns}
                />
            )}

            {model.chartError && (
                <StatusMessage tone="error">{model.chartError}</StatusMessage>
            )}
        </div>
    </>
);
