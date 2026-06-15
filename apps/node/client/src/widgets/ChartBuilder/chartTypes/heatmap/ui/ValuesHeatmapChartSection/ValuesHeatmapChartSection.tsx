import { aggregates } from '@qualification-work/types';

import { AGGREGATE_LABELS } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { FormField } from '@/shared/ui';

import type { ChartTypeSettingsProps } from '../../../../model';
import {
    createActiveStringBind,
    getActiveMeasure,
    needsColumn,
} from '../../../common/model';

import type { HeatmapChartDraft } from '../../model';

import styles from './ValuesHeatmapChartSection.module.scss';

const measureFormatMaxLength = 24;

const valuesHeatmapChartSectionBinds = {
    measureColumnId: (activeColumnId: string) =>
        createActiveStringBind<HeatmapChartDraft>('measureColumnId', activeColumnId),
} as const;

type ValuesHeatmapChartSectionProps = {
    config: ChartTypeSettingsProps<HeatmapChartDraft>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
};

export const ValuesHeatmapChartSection = ({
    config,
    columns,
    editMode,
}: ValuesHeatmapChartSectionProps) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;
    const activeMeasure = getActiveMeasure(
        columns,
        draft.measureAggregate,
        draft.measureColumnId,
        editMode
    );

    return (
        <config.Section name="Values" className={styles['section']}>
            <FormField label="Aggregation">
                <config.Select field="measureAggregate">
                    {aggregates.map(item => (
                        <option key={item} value={item}>
                            {AGGREGATE_LABELS[item]}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            {needsColumn(draft.measureAggregate) && (
                <FormField label="Column">
                    <config.Select
                        bind={valuesHeatmapChartSectionBinds.measureColumnId(
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
                    field="measureValueFormat"
                    maxLength={measureFormatMaxLength}
                    placeholder="%, ₽, шт"
                />
            </FormField>
        </config.Section>
    );
};
