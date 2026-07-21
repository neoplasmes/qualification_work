import { Divider, Field, Input, Select } from '@qualification-work/design-system';
import type { ChartType } from '@qualification-work/types';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { chartDefinitions, type ChartBuilderDraft } from '../../model';
import { ColorPickerControl } from '../ColorPickerControl';

import styles from './AppearanceSection.module.scss';

type AppearanceSectionProps = {
    editMode: boolean;
    selectedDataset: DatasetMetadata;
    value: ChartBuilderDraft;
    onNameChange: (chartName: string) => void;
    onColorChange: (chartColor: string) => void;
    onTypeChange: (chartType: ChartType) => void;
};

export const AppearanceSection = ({
    editMode,
    selectedDataset,
    value,
    onNameChange,
    onColorChange,
    onTypeChange,
}: AppearanceSectionProps) => (
    <section data-stack="v" data-gap="sm">
        <div
            className={styles['header']}
            data-stack="h"
            data-gap="sm"
            data-align="center"
        >
            <Divider data-flex />
            <span>Appearance</span>
        </div>

        <config-section-body data-stack="v" data-gap="sm">
            {!editMode && (
                <Field label="Chart name">
                    <Input
                        value={value.chartName}
                        placeholder={`${selectedDataset.dataset.name} chart`}
                        onChange={event => onNameChange(event.target.value)}
                    />
                </Field>
            )}

            <Field label="Chart type">
                <Select
                    value={value.chartType}
                    onChange={event => onTypeChange(event.target.value as ChartType)}
                >
                    {Object.values(chartDefinitions).map(definition => (
                        <option key={definition.chartType} value={definition.chartType}>
                            {definition.label}
                        </option>
                    ))}
                </Select>
            </Field>

            <ColorPickerControl value={value.chartColor} onChange={onColorChange} />
        </config-section-body>
    </section>
);
