import { clamp } from 'es-toolkit/math';

import type { ChartTypeSettingsProps } from '../../../model';

import {
    createActiveStringBind,
    createBooleanSelectBind,
    createChartTypeBind,
    createNumberInputBind,
    getActiveAnalysisColumnId,
} from '../../common/model';
import {
    BreakdownSettingsSection,
    FilterSettingsSection,
    ValueSectionDefault,
} from '../../common/ui';
import type { BarChartDraft } from '../model';
import { ChartBarChartSection } from './ChartBarChartSection';

const barChartSettingsBinds = {
    breakdownColumnId: (activeColumnId: string) =>
        createActiveStringBind<BarChartDraft>('breakdownColumnId', activeColumnId),
    breakdownTopN: createNumberInputBind<BarChartDraft, 'breakdownTopN'>(
        'breakdownTopN',
        value => clamp(value, 1, 50)
    ),
    breakdownOtherBucketSelect: createBooleanSelectBind(
        createChartTypeBind<BarChartDraft, 'breakdownOtherBucket'>('breakdownOtherBucket')
    ),
    filterColumnId: (activeColumnId: string) =>
        createActiveStringBind<BarChartDraft>('filterColumnId', activeColumnId),
} as const;

export const BarChartSettings = ({
    config,
    selectedDataset,
    editMode,
}: ChartTypeSettingsProps<BarChartDraft>) => {
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
            <ChartBarChartSection config={config} columns={columns} editMode={editMode} />
            <ValueSectionDefault config={config} columns={columns} editMode={editMode} />

            <BreakdownSettingsSection
                config={config}
                enabledField="breakdownEnabled"
                columnBind={barChartSettingsBinds.breakdownColumnId(
                    activeBreakdownColumnId
                )}
                topNBind={barChartSettingsBinds.breakdownTopN}
                otherBucketBind={barChartSettingsBinds.breakdownOtherBucketSelect}
                columns={columns}
                showOtherBucket
            />
            <FilterSettingsSection
                config={config}
                enabledField="filterEnabled"
                columnBind={barChartSettingsBinds.filterColumnId(activeFilterColumnId)}
                operationField="filterOperation"
                valueField="filterValue"
                columns={columns}
            />
        </>
    );
};
