import { aggregates } from '@qualification-work/types';

import { AGGREGATE_LABELS } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { FormField } from '@/shared/ui';

import type { ChartTypeSettingsProps } from '../../../../model';
import {
    createActiveStringBind,
    createNumberInputBind,
    getActiveMeasure,
    needsColumn,
} from '../../../common/model';

import type { PieChartDraft } from '../../model';

import styles from './ValuesPieChartSection.module.scss';

const measureFormatMaxLength = 24;

const valuesPieChartSectionBinds = {
    measureColumnId: (activeColumnId: string) =>
        createActiveStringBind<PieChartDraft>('measureColumnId', activeColumnId),
    topN: createNumberInputBind<PieChartDraft, 'topN'>('topN', value =>
        Math.min(Math.max(1, value), 50)
    ),
} as const;

type ValuesPieChartSectionProps = {
    config: ChartTypeSettingsProps<PieChartDraft>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
};

export const ValuesPieChartSection = ({
    config,
    columns,
    editMode,
}: ValuesPieChartSectionProps) => {
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
                        bind={valuesPieChartSectionBinds.measureColumnId(
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

            <FormField label="Max slices">
                <config.Input
                    bind={valuesPieChartSectionBinds.topN}
                    type="number"
                    min={1}
                    max={50}
                />
            </FormField>
        </config.Section>
    );
};
