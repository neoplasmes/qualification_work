import { FormField } from '@/shared/ui';

import type { ChartTypeSettingsProps } from '../../../model';

import {
    createActiveStringBind,
    createNumberInputBind,
    getActiveAnalysisColumnId,
} from '../../common/model';
import { FilterSettingsSection, ValueSectionDefault } from '../../common/ui';
import type { PieChartDraft } from '../model';
import { ChartPieChartSection } from './ChartPieChartSection';

const pieChartSettingsBinds = {
    topN: createNumberInputBind<PieChartDraft, 'topN'>('topN', value =>
        Math.min(Math.max(1, value), 50)
    ),
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
            <ValueSectionDefault
                config={config}
                columns={columns}
                editMode={editMode}
                maxMeasureCount={1}
            >
                <FormField label="Max slices">
                    <config.Input
                        bind={pieChartSettingsBinds.topN}
                        type="number"
                        min={1}
                        max={50}
                    />
                </FormField>
            </ValueSectionDefault>

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
