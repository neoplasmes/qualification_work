import type { ChartTypeSettingsProps } from '../../../model';

import { createActiveStringBind, getActiveAnalysisColumnId } from '../../common/model';
import { FilterSettingsSection } from '../../common/ui';
import type { HeatmapChartDraft } from '../model';
import { ChartHeatmapChartSection } from './ChartHeatmapChartSection';
import { ValuesHeatmapChartSection } from './ValuesHeatmapChartSection';

const heatmapChartSettingsBinds = {
    filterColumnId: (activeColumnId: string) =>
        createActiveStringBind<HeatmapChartDraft>('filterColumnId', activeColumnId),
} as const;

export const HeatmapChartSettings = ({
    config,
    selectedDataset,
    editMode,
}: ChartTypeSettingsProps<HeatmapChartDraft>) => {
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
            <ChartHeatmapChartSection
                config={config}
                columns={columns}
                editMode={editMode}
            />
            <ValuesHeatmapChartSection
                config={config}
                columns={columns}
                editMode={editMode}
            />

            <FilterSettingsSection
                config={config}
                enabledField="filterEnabled"
                columnBind={heatmapChartSettingsBinds.filterColumnId(
                    activeFilterColumnId
                )}
                operationField="filterOperation"
                valueField="filterValue"
                columns={columns}
            />
        </>
    );
};
