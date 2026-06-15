import { clamp } from 'es-toolkit/math';

import type { ChartTypeSettingsProps } from '../../../model';

import {
    createActiveStringBind,
    createNumberInputBind,
    getActiveAnalysisColumnId,
} from '../../common/model';
import { BreakdownSettingsSection, FilterSettingsSection } from '../../common/ui';
import type { LineChartDraft } from '../model';
import { ChartLineChartSection } from './ChartLineChartSection';
import { ValuesLineChartSection } from './ValuesLineChartSection';

const lineChartSettingsBinds = {
    breakdownColumnId: (activeColumnId: string) =>
        createActiveStringBind<LineChartDraft>('breakdownColumnId', activeColumnId),
    breakdownTopN: createNumberInputBind<LineChartDraft, 'breakdownTopN'>(
        'breakdownTopN',
        value => clamp(value, 1, 50)
    ),
    filterColumnId: (activeColumnId: string) =>
        createActiveStringBind<LineChartDraft>('filterColumnId', activeColumnId),
} as const;

export const LineChartSettings = ({
    config,
    selectedDataset,
    editMode,
}: ChartTypeSettingsProps<LineChartDraft>) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;
    const columns = selectedDataset.columns;
    const activeBreakdownColumnId = getActiveAnalysisColumnId(
        columns,
        draft.breakdownColumnId,
        editMode
    );
    const activeFilterColumnId = getActiveAnalysisColumnId(
        columns,
        draft.filterColumnId,
        editMode
    );

    return (
        <>
            <ChartLineChartSection
                config={config}
                columns={columns}
                editMode={editMode}
            />
            <ValuesLineChartSection
                config={config}
                columns={columns}
                editMode={editMode}
            />

            <BreakdownSettingsSection
                config={config}
                enabledField="breakdownEnabled"
                columnBind={lineChartSettingsBinds.breakdownColumnId(
                    activeBreakdownColumnId
                )}
                topNBind={lineChartSettingsBinds.breakdownTopN}
                columns={columns}
                showOtherBucket={false}
            />
            <FilterSettingsSection
                config={config}
                enabledField="filterEnabled"
                columnBind={lineChartSettingsBinds.filterColumnId(activeFilterColumnId)}
                operationField="filterOperation"
                valueField="filterValue"
                columns={columns}
            />
        </>
    );
};
