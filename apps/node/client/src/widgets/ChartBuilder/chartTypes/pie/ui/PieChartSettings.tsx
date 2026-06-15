import type { ChartTypeSettingsProps } from '../../../model';

import { createActiveStringBind, getActiveAnalysisColumnId } from '../../common/model';
import { FilterSettingsSection } from '../../common/ui';
import type { PieChartDraft } from '../model';
import { ChartPieChartSection } from './ChartPieChartSection';
import { ValuesPieChartSection } from './ValuesPieChartSection';

const pieChartSettingsBinds = {
    filterColumnId: (activeColumnId: string) =>
        createActiveStringBind<PieChartDraft>('filterColumnId', activeColumnId),
} as const;

export const PieChartSettings = ({
    config,
    selectedDataset,
    editMode,
}: ChartTypeSettingsProps<PieChartDraft>) => {
    const snapshot = config.useConfig();
    const draft = snapshot.draft;
    const columns = selectedDataset.columns;
    const activeFilterColumnId = getActiveAnalysisColumnId(
        columns,
        draft.filterColumnId,
        editMode
    );

    return (
        <>
            <ChartPieChartSection config={config} columns={columns} editMode={editMode} />
            <ValuesPieChartSection
                config={config}
                columns={columns}
                editMode={editMode}
            />

            <FilterSettingsSection
                config={config}
                enabledField="filterEnabled"
                columnBind={pieChartSettingsBinds.filterColumnId(activeFilterColumnId)}
                operationField="filterOperation"
                valueField="filterValue"
                columns={columns}
            />
        </>
    );
};
