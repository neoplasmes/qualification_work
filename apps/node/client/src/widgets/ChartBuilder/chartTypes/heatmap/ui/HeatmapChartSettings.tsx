import type { ChartTypeSettingsProps } from '../../../model';

import { createActiveStringBind, getActiveAnalysisColumnId } from '../../common/model';
import { FilterSettingsSection, ValueSectionDefault } from '../../common/ui';
import type { HeatmapChartDraft } from '../model';
import { ChartHeatmapChartSection } from './ChartHeatmapChartSection';

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
            <ValueSectionDefault
                config={config}
                columns={columns}
                editMode={editMode}
                maxMeasureCount={1}
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
