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

import type { HeatmapChartDraft } from '../../model';

const chartHeatmapChartSectionBinds = {
    xColumnId: (columns: DatasetColumn[], activeColumnId: string) =>
        createAxisColumnBind<HeatmapChartDraft>(
            'xColumnId',
            'xGroupingMode',
            columns,
            activeColumnId
        ),
    xGroupingMode: (groupingModes: GroupingMode[]) =>
        createGroupingModeBind<HeatmapChartDraft>('xGroupingMode', groupingModes),
    xStep: createNumberInputBind<HeatmapChartDraft, 'xStep'>('xStep', value =>
        Math.max(1, value)
    ),
    yColumnId: (columns: DatasetColumn[], activeColumnId: string) =>
        createAxisColumnBind<HeatmapChartDraft>(
            'yColumnId',
            'yGroupingMode',
            columns,
            activeColumnId
        ),
    yGroupingMode: (groupingModes: GroupingMode[]) =>
        createGroupingModeBind<HeatmapChartDraft>('yGroupingMode', groupingModes),
    yStep: createNumberInputBind<HeatmapChartDraft, 'yStep'>('yStep', value =>
        Math.max(1, value)
    ),
} as const;

type ChartHeatmapChartSectionProps = {
    config: ChartTypeSettingsProps<HeatmapChartDraft>['config'];
    columns: DatasetColumn[];
    editMode: boolean;
};

export const ChartHeatmapChartSection = ({
    config,
    columns,
    editMode,
}: ChartHeatmapChartSectionProps) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;
    const activeXColumnId = getActiveAnalysisColumnId(columns, draft.xColumnId, editMode);
    const activeYColumnId = getActiveAnalysisColumnId(
        columns,
        draft.yColumnId,
        editMode,
        1
    );
    const activeXColumn = columns.find(column => column.id === activeXColumnId);
    const activeYColumn = columns.find(column => column.id === activeYColumnId);
    const xGroupingModes = getGroupingModes(activeXColumn?.dataType);
    const yGroupingModes = getGroupingModes(activeYColumn?.dataType);

    return (
        <config.Section name="Chart">
            <FormField label="X axis">
                <config.Select
                    bind={chartHeatmapChartSectionBinds.xColumnId(
                        columns,
                        activeXColumnId
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

            <FormField label="Y axis">
                <config.Select
                    bind={chartHeatmapChartSectionBinds.yColumnId(
                        columns,
                        activeYColumnId
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

            <FormField label="Group X by">
                <config.Select
                    bind={chartHeatmapChartSectionBinds.xGroupingMode(xGroupingModes)}
                    disabled={xGroupingModes.length === 1}
                >
                    {xGroupingModes.map(mode => (
                        <option key={mode} value={mode}>
                            {groupingLabels[mode]}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            {draft.xGroupingMode === 'time' && (
                <FormField label="X time unit">
                    <config.Select field="xGranularity">
                        {timeGranularities.map(item => (
                            <option key={item} value={item}>
                                {GRANULARITY_LABELS[item]}
                            </option>
                        ))}
                    </config.Select>
                </FormField>
            )}

            {draft.xGroupingMode === 'numeric' && (
                <FormField label="X bucket size">
                    <config.Input
                        bind={chartHeatmapChartSectionBinds.xStep}
                        type="number"
                        min={1}
                    />
                </FormField>
            )}

            <FormField label="Group Y by">
                <config.Select
                    bind={chartHeatmapChartSectionBinds.yGroupingMode(yGroupingModes)}
                    disabled={yGroupingModes.length === 1}
                >
                    {yGroupingModes.map(mode => (
                        <option key={mode} value={mode}>
                            {groupingLabels[mode]}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            {draft.yGroupingMode === 'time' && (
                <FormField label="Y time unit">
                    <config.Select field="yGranularity">
                        {timeGranularities.map(item => (
                            <option key={item} value={item}>
                                {GRANULARITY_LABELS[item]}
                            </option>
                        ))}
                    </config.Select>
                </FormField>
            )}

            {draft.yGroupingMode === 'numeric' && (
                <FormField label="Y bucket size">
                    <config.Input
                        bind={chartHeatmapChartSectionBinds.yStep}
                        type="number"
                        min={1}
                    />
                </FormField>
            )}
        </config.Section>
    );
};
