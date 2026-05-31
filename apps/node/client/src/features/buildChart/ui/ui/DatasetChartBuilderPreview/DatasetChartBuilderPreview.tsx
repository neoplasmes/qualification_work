import { PencilLine, Save } from 'lucide-react';

import { ChartConfigSummary, ChartShell } from '@/entities/chart';

import { Button, StatusMessage, TextInput } from '@/shared/ui';

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

            <div data-stack="h" data-gap="sm">
                <Button type="button" onClick={model.onBackToConfig}>
                    <PencilLine size={18} />
                    Edit
                </Button>
                <Button
                    type="button"
                    disabled={model.isSaving}
                    isLoading={model.isSaving}
                    onClick={model.onSave}
                >
                    <Save size={18} />
                    {model.editMode ? 'Save changes' : 'Save chart'}
                </Button>
            </div>

            {model.chartError && (
                <StatusMessage tone="error">{model.chartError}</StatusMessage>
            )}
        </div>
    </>
);
