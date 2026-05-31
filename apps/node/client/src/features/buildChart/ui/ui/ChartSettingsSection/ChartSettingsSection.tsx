import { type ChartType } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { Select, TextInput } from '@/shared/ui';

import { chartTypeLabels, chartTypes } from '../../../const';
import type { ChartBuilderState } from '../../../model';

import { ColorPickerControl } from '../ColorPickerControl';

import styles from '../../DatasetChartBuilder.module.scss';

type ChartSettingsSectionProps = {
    editMode: boolean;
    fields: ChartBuilderState;
    selectedDataset: DatasetMetadata;
};

export const ChartSettingsSection = ({
    editMode,
    fields,
    selectedDataset,
}: ChartSettingsSectionProps) => (
    <>
        <div
            className={styles['section']}
            data-stack="h"
            data-gap="sm"
            data-align="center"
        >
            Chart
        </div>

        {!editMode && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Chart name</span>
                <TextInput
                    value={fields.chartName}
                    placeholder={`${selectedDataset.dataset.name} chart`}
                    onChange={event => fields.setChartName(event.target.value)}
                />
            </label>
        )}

        <label className={styles['control']} data-stack="v" data-gap="xs">
            <span>Chart type</span>
            <Select
                value={fields.chartType}
                onChange={event => fields.setChartType(event.target.value as ChartType)}
            >
                {chartTypes.map(type => (
                    <option key={type} value={type}>
                        {chartTypeLabels[type]}
                    </option>
                ))}
            </Select>
        </label>

        <ColorPickerControl value={fields.chartColor} onChange={fields.setChartColor} />
    </>
);
