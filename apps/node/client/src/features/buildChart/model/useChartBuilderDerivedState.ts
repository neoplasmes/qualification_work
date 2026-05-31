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
    const measureColumns =
        fields.aggregate === 'count_distinct' ? columns : numericColumns;
    const activeMeasureColumnId = getActiveAnalysisColumnId(
        measureColumns,
        fields.measureColumnId,
        editMode
    );
    const secondMeasureColumns =
        fields.secondAggregate === 'count_distinct' ? columns : numericColumns;
    const activeSecondMeasureColumnId = getActiveAnalysisColumnId(
        secondMeasureColumns,
        fields.secondMeasureColumnId,
        editMode,
        1
    );
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
    const selectedAnalysisColumnsEnabled =
        isAnalysisColumnEnabled(columns, activeDimensionColumnId) &&
        (fields.chartType !== 'heatmap' ||
            isAnalysisColumnEnabled(columns, activeHeatmapYColumnId)) &&
        (!needsColumn(fields.aggregate) ||
            isAnalysisColumnEnabled(measureColumns, activeMeasureColumnId)) &&
        (!fields.secondMeasureEnabled ||
            fields.chartType === 'pie' ||
            fields.chartType === 'heatmap' ||
            !needsColumn(fields.secondAggregate) ||
            isAnalysisColumnEnabled(secondMeasureColumns, activeSecondMeasureColumnId)) &&
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
        (!needsColumn(fields.aggregate) || Boolean(activeMeasureColumnId)) &&
        (!fields.secondMeasureEnabled ||
            !needsColumn(fields.secondAggregate) ||
            Boolean(activeSecondMeasureColumnId)) &&
        (!fields.seriesEnabled || Boolean(activeSeriesColumnId)) &&
        selectedAnalysisColumnsEnabled;

    return {
        columns,
        measureColumns,
        secondMeasureColumns,
        activeDimensionColumnId,
        activeHeatmapYColumnId,
        activeMeasureColumnId,
        activeSecondMeasureColumnId,
        activeSeriesColumnId,
        activeFilterColumn,
        dimGroupingModes,
        heatmapYGroupingModes,
        nullaryFilter,
        canPreview,
    };
};
