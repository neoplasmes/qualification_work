import { StatusMessage } from '@/shared/ui';

import type { DatasetChartBuilderViewModel } from '../../../model';

import { AxisSettingsSection } from '../AxisSettingsSection';
import { BreakdownSettingsSection } from '../BreakdownSettingsSection';
import { ChartSettingsSection } from '../ChartSettingsSection';
import { FilterSettingsSection } from '../FilterSettingsSection';
import { MeasureSettingsSection } from '../MeasureSettingsSection';

import styles from '../../DatasetChartBuilder.module.scss';

type DatasetChartBuilderConfigFormProps = {
    model: DatasetChartBuilderViewModel;
    formId: string;
};

export const DatasetChartBuilderConfigForm = ({
    model,
    formId,
}: DatasetChartBuilderConfigFormProps) => (
    <>
        <form
            id={formId}
            className={styles['chart-form']}
            data-display="grid"
            data-gap="sm"
            onSubmit={model.onPreview}
        >
            <ChartSettingsSection
                editMode={model.editMode}
                fields={model.fields}
                selectedDataset={model.selectedDataset}
            />
            <AxisSettingsSection
                derived={model.derived}
                fields={model.fields}
                onDimensionColumnChange={model.onDimensionColumnChange}
                onHeatmapYColumnChange={model.onHeatmapYColumnChange}
            />
            <MeasureSettingsSection derived={model.derived} fields={model.fields} />
            <BreakdownSettingsSection derived={model.derived} fields={model.fields} />
            <FilterSettingsSection derived={model.derived} fields={model.fields} />
        </form>

        {model.chartError && (
            <StatusMessage tone="error">{model.chartError}</StatusMessage>
        )}
    </>
);
