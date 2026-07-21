import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { Field } from '@qualification-work/design-system';
import { timeGranularities } from '@qualification-work/types';

import { GRANULARITY_LABELS } from '@/entities/chart';

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

import type { BarChartDraft } from '../../model';

const chartBarChartSectionBinds = {
    dimensionColumnId: (columns: DatasetColumn[], activeColumnId: string) =>
        createAxisColumnBind<BarChartDraft>(
            'dimensionColumnId',
            'dimensionGroupingMode',
            columns,
            activeColumnId
        ),
    dimensionGroupingMode: (groupingModes: GroupingMode[]) =>
        createGroupingModeBind<BarChartDraft>('dimensionGroupingMode', groupingModes),
    dimensionStep: createNumberInputBind<BarChartDraft, 'dimensionStep'>(
        'dimensionStep',
        value => Math.max(1, value)
    ),
} as const;

type ChartBarChartSectionProps = {
    config: ChartTypeSettingsProps<BarChartDraft>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
};

export const ChartBarChartSection = ({
    config,
    columns,
    editMode,
}: ChartBarChartSectionProps) => {
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
        <config.Section name="Chart">
            <Field label="X axis">
                <config.Select
                    bind={chartBarChartSectionBinds.dimensionColumnId(
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
            </Field>

            <Field label="Group X by">
                <config.Select
                    bind={chartBarChartSectionBinds.dimensionGroupingMode(groupingModes)}
                    disabled={groupingModes.length === 1}
                >
                    {groupingModes.map(mode => (
                        <option key={mode} value={mode}>
                            {groupingLabels[mode]}
                        </option>
                    ))}
                </config.Select>
            </Field>

            {draft.dimensionGroupingMode === 'time' && (
                <Field label="Time unit">
                    <config.Select field="dimensionGranularity">
                        {timeGranularities.map(item => (
                            <option key={item} value={item}>
                                {GRANULARITY_LABELS[item]}
                            </option>
                        ))}
                    </config.Select>
                </Field>
            )}

            {draft.dimensionGroupingMode === 'numeric' && (
                <Field label="Bucket size">
                    <config.Input
                        bind={chartBarChartSectionBinds.dimensionStep}
                        type="number"
                        min={1}
                    />
                </Field>
            )}
        </config.Section>
    );
};
