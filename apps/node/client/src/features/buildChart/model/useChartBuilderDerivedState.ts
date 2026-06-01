import { useMemo } from 'react';

import type { DatasetColumn } from '@/entities/dataset';

import { getActiveAnalysisColumnId, isAnalysisColumnEnabled, needsColumn } from '../lib';
import type { GroupingMode } from '../types';
import type { ChartBuilderDerivedState, ChartBuilderState } from './types';

const getGroupingModes = (
    dataType: DatasetColumn['dataType'] | undefined
): GroupingMode[] => {
    const modes: GroupingMode[] = ['none'];

    if (dataType === 'date') {
        modes.push('time');
    }

    if (dataType === 'number') {
        modes.push('numeric');
    }

    return modes;
};

type UseChartBuilderDerivedStateParams = {
    columns: DatasetColumn[];
    editMode: boolean;
    fields: ChartBuilderState;
};

export const useChartBuilderDerivedState = ({
    columns,
    editMode,
    fields,
}: UseChartBuilderDerivedStateParams): ChartBuilderDerivedState => {
    const numericColumns = useMemo(
        () => columns.filter(column => column.dataType === 'number'),
        [columns]
    );
    const activeDimensionColumnId = getActiveAnalysisColumnId(
        columns,
        fields.dimensionColumnId,
        editMode
    );
    const activeDimensionColumn = columns.find(
        column => column.id === activeDimensionColumnId
    );
    const activeHeatmapYColumnId = getActiveAnalysisColumnId(
        columns,
        fields.heatmapYColumnId,
        editMode,
        1
    );
    const activeHeatmapYColumn = columns.find(
        column => column.id === activeHeatmapYColumnId
    );
    const measures = fields.measures.map((measure, index) => {
        const measureColumns =
            measure.aggregate === 'count_distinct' ? columns : numericColumns;

        return {
            columns: measureColumns,
            activeColumnId: getActiveAnalysisColumnId(
                measureColumns,
                measure.columnId,
                editMode,
                index
            ),
        };
    });
    const activeSeriesColumnId = getActiveAnalysisColumnId(
        columns,
        fields.seriesColumnId,
        editMode
    );
    const activeFilterColumnId = getActiveAnalysisColumnId(
        columns,
        fields.filterColumnId,
        editMode
    );
    const activeFilterColumn = columns.find(column => column.id === activeFilterColumnId);
    const dimGroupingModes = useMemo(
        () => getGroupingModes(activeDimensionColumn?.dataType),
        [activeDimensionColumn?.dataType]
    );
    const heatmapYGroupingModes = useMemo(
        () => getGroupingModes(activeHeatmapYColumn?.dataType),
        [activeHeatmapYColumn?.dataType]
    );
    const nullaryFilter =
        fields.filterOperation === 'is_null' || fields.filterOperation === 'not_null';
    // pie/heatmap only consume the first measure, ignore any extras kept in state
    const usedMeasureCount =
        fields.chartType === 'pie' || fields.chartType === 'heatmap'
            ? 1
            : fields.measures.length;
    const usedMeasures = fields.measures
        .slice(0, usedMeasureCount)
        .map((measure, index) => ({ measure, derived: measures[index] }));
    const measureColumnsResolved = usedMeasures.every(
        ({ measure, derived }) =>
            !needsColumn(measure.aggregate) || Boolean(derived.activeColumnId)
    );
    const measureColumnsEnabled = usedMeasures.every(
        ({ measure, derived }) =>
            !needsColumn(measure.aggregate) ||
            isAnalysisColumnEnabled(derived.columns, derived.activeColumnId)
    );
    const selectedAnalysisColumnsEnabled =
        isAnalysisColumnEnabled(columns, activeDimensionColumnId) &&
        (fields.chartType !== 'heatmap' ||
            isAnalysisColumnEnabled(columns, activeHeatmapYColumnId)) &&
        measureColumnsEnabled &&
        (!fields.seriesEnabled ||
            fields.chartType === 'pie' ||
            fields.chartType === 'heatmap' ||
            isAnalysisColumnEnabled(columns, activeSeriesColumnId)) &&
        (!fields.filterEnabled ||
            (activeFilterColumn
                ? isAnalysisColumnEnabled(columns, activeFilterColumn.id)
                : false));
    const canPreview =
        Boolean(activeDimensionColumnId) &&
        (fields.chartType !== 'heatmap' || Boolean(activeHeatmapYColumnId)) &&
        (fields.chartType !== 'heatmap' ||
            activeDimensionColumnId !== activeHeatmapYColumnId) &&
        measureColumnsResolved &&
        (!fields.seriesEnabled || Boolean(activeSeriesColumnId)) &&
        selectedAnalysisColumnsEnabled;

    return {
        columns,
        measures,
        activeDimensionColumnId,
        activeHeatmapYColumnId,
        activeSeriesColumnId,
        activeFilterColumn,
        dimGroupingModes,
        heatmapYGroupingModes,
        nullaryFilter,
        canPreview,
    };
};
