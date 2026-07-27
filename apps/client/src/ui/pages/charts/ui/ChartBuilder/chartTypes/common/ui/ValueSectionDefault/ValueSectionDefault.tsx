import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { aggregateLabels } from '@/ui/widgets/ChartShell';
import { Button, Field, IconButton } from '@qualification-work/design-system';
import { aggregates } from '@qualification-work/types';
import { Plus, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

import type { ChartTypeSettingsProps } from '../../../../model';

import {
    createChartTypeBind,
    createMeasureBinds,
    createMeasureDraft,
    getAcceptableColumnsForSelectedAggregationType,
    maxMeasures,
    type MeasureDraft,
} from '../../model';

import styles from './ValueSectionDefault.module.css';

const measureValueFormatMaxLength = 24;

type ValueSectionDefaultDraft = {
    measures: MeasureDraft[];
};

type ValueSectionDefaultProps<T extends ValueSectionDefaultDraft> = {
    config: ChartTypeSettingsProps<T>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
    maxMeasureCount?: number;
    /**
     * extra controls for a single measure
     *
     * @param measure - draft of the measure with all available settings
     * @param index - index/number of the value (measure (I probably should use a single name, but that's the legacy))
     * @returns
     */
    renderMeasureExtra?: (measure: MeasureDraft, index: number) => ReactNode;
    /** extra settings for the whole values section */
    children?: ReactNode;
};

export const ValueSectionDefault = <T extends ValueSectionDefaultDraft>({
    config,
    columns,
    editMode,
    maxMeasureCount = maxMeasures,
    renderMeasureExtra,
    children,
}: ValueSectionDefaultProps<T>) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;

    const measuresBind = createChartTypeBind<T, 'measures'>('measures');

    const canAddMeasure = draft.measures.length < maxMeasureCount;
    const canRemoveMeasure = maxMeasureCount > 1 && draft.measures.length > 1;

    const handleAddMeasure = () => {
        snapshot.setValue(measuresBind, measures => [
            ...measures,
            createMeasureDraft({ aggregate: 'avg' }),
        ]);
    };

    const handleRemoveMeasure = (index: number) => {
        snapshot.setValue(measuresBind, measures =>
            measures.filter((_, measureIndex) => measureIndex !== index)
        );
    };

    return (
        <config.Section
            name="Показатели"
            data-gap="sm"
            className={styles['value-section']}
        >
            {draft.measures.map((measure, index) => {
                const acceptableMeasureColumns =
                    getAcceptableColumnsForSelectedAggregationType(
                        columns,
                        measure.aggregate,
                        measure.columnId,
                        editMode,
                        index
                    );
                const measureBinds = createMeasureBinds<T>(
                    index,
                    acceptableMeasureColumns.activeColumnId
                );

                return (
                    <div key={index} data-stack="v" className={styles['measure']}>
                        <div
                            data-stack="h"
                            data-gap="xs"
                            data-align="center"
                            className={styles['measure-header']}
                            data-pb="sm"
                        >
                            <span
                                className={styles['measure-label']}
                            >{`Значение Y ${index + 1}`}</span>
                            {canRemoveMeasure && (
                                <IconButton
                                    variant="ghost"
                                    data-p="none"
                                    className={styles['measure-remove']}
                                    aria-label={`Удалить значение Y ${index + 1}`}
                                    onClick={() => handleRemoveMeasure(index)}
                                >
                                    <Trash2 size={14} />
                                </IconButton>
                            )}
                        </div>

                        <config-section-body>
                            <Field label="Расчёт">
                                <config.Select bind={measureBinds.aggregate}>
                                    {aggregates.map(item => (
                                        <option key={item} value={item}>
                                            {aggregateLabels[item]}
                                        </option>
                                    ))}
                                </config.Select>
                            </Field>

                            {measure.aggregate !== 'count' && (
                                <Field label="Поле">
                                    <config.Select bind={measureBinds.columnId}>
                                        {acceptableMeasureColumns.columns.map(column => (
                                            <option
                                                key={column.id}
                                                value={column.id}
                                                disabled={column.isAnalyzable === false}
                                            >
                                                {column.displayName}
                                            </option>
                                        ))}
                                    </config.Select>
                                </Field>
                            )}

                            <Field label="Формат значения">
                                <config.Input
                                    bind={measureBinds.valueFormat}
                                    maxLength={measureValueFormatMaxLength}
                                    placeholder="%, ₽, шт"
                                />
                            </Field>

                            {renderMeasureExtra?.(measure, index)}
                            {children}
                        </config-section-body>
                    </div>
                );
            })}

            {canAddMeasure && (
                <Button
                    className={styles['add-measure']}
                    data-pl="none"
                    onClick={handleAddMeasure}
                >
                    <Plus size={16} />
                    Добавить показатель
                </Button>
            )}
        </config.Section>
    );
};
