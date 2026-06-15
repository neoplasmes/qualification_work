import { aggregates } from '@qualification-work/types';
import { Plus, X } from 'lucide-react';
import { Fragment } from 'react';

import { AGGREGATE_LABELS } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { Button, FormField, IconButton } from '@/shared/ui';

import type { ChartTypeSettingsProps } from '../../../../model';
import {
    createChartTypeBind,
    createMeasureAggregateBind,
    createMeasureColumnIdBind,
    createMeasureValueFormatBind,
    getActiveMeasure,
    maxMeasures,
    needsColumn,
} from '../../../common/model';

import type { LineChartDraft } from '../../model';

import styles from './ValuesLineChartSection.module.scss';

const measureFormatMaxLength = 24;

const valuesLineChartSectionBinds = {
    measures: createChartTypeBind<LineChartDraft, 'measures'>('measures'),
    measureAggregate: (index: number) =>
        createMeasureAggregateBind<LineChartDraft>(index),
    measureColumnId: (index: number, activeColumnId: string) =>
        createMeasureColumnIdBind<LineChartDraft>(index, activeColumnId),
    measureValueFormat: (index: number) =>
        createMeasureValueFormatBind<LineChartDraft>(index),
} as const;

type ValuesLineChartSectionProps = {
    config: ChartTypeSettingsProps<LineChartDraft>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
};

export const ValuesLineChartSection = ({
    config,
    columns,
    editMode,
}: ValuesLineChartSectionProps) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;
    const canAddMeasure = draft.measures.length < maxMeasures;
    const canRemoveMeasure = draft.measures.length > 1;

    return (
        <config.Section name="Values" className={styles['section']}>
            {draft.measures.map((measure, index) => {
                const activeMeasure = getActiveMeasure(
                    columns,
                    measure.aggregate,
                    measure.columnId,
                    editMode,
                    index
                );

                return (
                    <Fragment key={index}>
                        <div data-stack="h" data-gap="xs" data-align="center">
                            <span>{`Y value ${index + 1}`}</span>
                            {canRemoveMeasure && (
                                <IconButton
                                    tone="nav"
                                    className={styles['remove-measure']}
                                    aria-label={`Remove Y value ${index + 1}`}
                                    onClick={() =>
                                        snapshot.setValue(
                                            valuesLineChartSectionBinds.measures,
                                            measures =>
                                                measures.filter(
                                                    (_, measureIndex) =>
                                                        measureIndex !== index
                                                )
                                        )
                                    }
                                >
                                    <X size={14} />
                                </IconButton>
                            )}
                        </div>

                        <FormField label="Aggregation">
                            <config.Select
                                bind={valuesLineChartSectionBinds.measureAggregate(index)}
                            >
                                {aggregates.map(item => (
                                    <option key={item} value={item}>
                                        {AGGREGATE_LABELS[item]}
                                    </option>
                                ))}
                            </config.Select>
                        </FormField>

                        {needsColumn(measure.aggregate) && (
                            <FormField label="Column">
                                <config.Select
                                    bind={valuesLineChartSectionBinds.measureColumnId(
                                        index,
                                        activeMeasure.activeColumnId
                                    )}
                                >
                                    {activeMeasure.columns.map(column => (
                                        <option
                                            key={column.id}
                                            value={column.id}
                                            disabled={column.isAnalyzable === false}
                                        >
                                            {column.displayName}
                                        </option>
                                    ))}
                                </config.Select>
                            </FormField>
                        )}

                        <FormField label="Value format">
                            <config.Input
                                bind={valuesLineChartSectionBinds.measureValueFormat(
                                    index
                                )}
                                maxLength={measureFormatMaxLength}
                                placeholder="%, ₽, шт"
                            />
                        </FormField>
                    </Fragment>
                );
            })}

            {canAddMeasure && (
                <Button
                    className={styles['add-measure']}
                    data-pl="none"
                    onClick={() =>
                        snapshot.setValue(
                            valuesLineChartSectionBinds.measures,
                            measures => [
                                ...measures,
                                {
                                    aggregate: 'avg' as const,
                                    valueFormat: '',
                                    columnId: '',
                                },
                            ]
                        )
                    }
                >
                    <Plus size={16} />
                    Add measure
                </Button>
            )}
        </config.Section>
    );
};
