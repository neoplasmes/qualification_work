import type { ChartType } from '@/core/entities/chart';
import { Choice, Divider, Field, Input } from '@qualification-work/design-system';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { chartDefinitions, type ChartBuilderDraft } from '../../model';
import { ColorPickerControl } from '../ColorPickerControl';

import styles from './AppearanceSection.module.css';

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
            <span>Оформление</span>
        </div>

        <config-section-body data-stack="v" data-gap="sm">
            {!editMode && (
                <Field label="Название графика">
                    <Input
                        value={value.chartName}
                        placeholder={`${selectedDataset.dataset.name} — график`}
                        onChange={event => onNameChange(event.target.value)}
                    />
                </Field>
            )}

            <Field label="Тип графика">
                <Choice
                    value={value.chartType}
                    onValueChange={type => onTypeChange(type as ChartType)}
                    options={Object.values(chartDefinitions).map(definition => ({
                        value: definition.chartType,
                        label: definition.label,
                    }))}
                />
            </Field>

            <ColorPickerControl value={value.chartColor} onChange={onColorChange} />
        </config-section-body>
    </section>
);
