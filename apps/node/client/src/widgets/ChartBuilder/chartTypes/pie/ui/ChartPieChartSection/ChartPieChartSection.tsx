import { timeGranularities } from '@qualification-work/types';

import { GRANULARITY_LABELS } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { FormField } from '@/shared/ui';

import type { ChartTypeSettingsProps } from '../../../../model';
import { groupingLabels } from '../../../common/const';
import {
    createAxisColumnBind,
    createGroupingModeBind,
    createNumberInputBind,
    getActiveAnalysisColumnId,
    getGroupingModes,
    type GroupingMode,
} from '../../../common/model';

import type { PieChartDraft } from '../../model';

import styles from './ChartPieChartSection.module.scss';

const chartPieChartSectionBinds = {
    dimensionColumnId: (columns: DatasetColumn[], activeColumnId: string) =>
        createAxisColumnBind<PieChartDraft>(
            'dimensionColumnId',
            'dimensionGroupingMode',
            columns,
            activeColumnId
        ),
    dimensionGroupingMode: (groupingModes: GroupingMode[]) =>
        createGroupingModeBind<PieChartDraft>('dimensionGroupingMode', groupingModes),
    dimensionStep: createNumberInputBind<PieChartDraft, 'dimensionStep'>(
        'dimensionStep',
        value => Math.max(1, value)
    ),
} as const;

type ChartPieChartSectionProps = {
    config: ChartTypeSettingsProps<PieChartDraft>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
};

export const ChartPieChartSection = ({
    config,
    columns,
    editMode,
}: ChartPieChartSectionProps) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;
    const activeDimensionColumnId = getActiveAnalysisColumnId(
        columns,
        draft.dimensionColumnId,
        editMode
    );
    const activeDimensionColumn = columns.find(
        column => column.id === activeDimensionColumnId
    );
    const groupingModes = getGroupingModes(activeDimensionColumn?.dataType);

    return (
        <config.Section name="Chart" className={styles['section']}>
            <FormField label="Slice by">
                <config.Select
                    bind={chartPieChartSectionBinds.dimensionColumnId(
                        columns,
                        activeDimensionColumnId
                    )}
                >
                    {columns.map(column => (
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

            <FormField label="Group by">
                <config.Select
                    bind={chartPieChartSectionBinds.dimensionGroupingMode(groupingModes)}
                    disabled={groupingModes.length === 1}
                >
                    {groupingModes.map(mode => (
                        <option key={mode} value={mode}>
                            {groupingLabels[mode]}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            {draft.dimensionGroupingMode === 'time' && (
                <FormField label="Time unit">
                    <config.Select field="dimensionGranularity">
                        {timeGranularities.map(item => (
                            <option key={item} value={item}>
                                {GRANULARITY_LABELS[item]}
                            </option>
                        ))}
                    </config.Select>
                </FormField>
            )}

            {draft.dimensionGroupingMode === 'numeric' && (
                <FormField label="Bucket size">
                    <config.Input
                        bind={chartPieChartSectionBinds.dimensionStep}
                        type="number"
                        min={1}
                    />
                </FormField>
            )}
        </config.Section>
    );
};
