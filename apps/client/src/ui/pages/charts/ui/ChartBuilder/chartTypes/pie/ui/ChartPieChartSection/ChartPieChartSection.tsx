import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { granularityLabels } from '@/ui/widgets/ChartShell';
import { Field } from '@qualification-work/design-system';
import { timeGranularities } from '@qualification-work/types';

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
        <config.Section name="Chart">
            <Field label="Slice by">
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
            </Field>

            <Field label="Group by">
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
            </Field>

            {draft.dimensionGroupingMode === 'time' && (
                <Field label="Time unit">
                    <config.Select field="dimensionGranularity">
                        {timeGranularities.map(item => (
                            <option key={item} value={item}>
                                {granularityLabels[item]}
                            </option>
                        ))}
                    </config.Select>
                </Field>
            )}

            {draft.dimensionGroupingMode === 'numeric' && (
                <Field label="Bucket size">
                    <config.Input
                        bind={chartPieChartSectionBinds.dimensionStep}
                        type="number"
                        min={1}
                    />
                </Field>
            )}
        </config.Section>
    );
};
