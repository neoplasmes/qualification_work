import type { ChartConfig, LineChartConfig } from '@qualification-work/types';

import { normalizeChartColor } from '@/entities/chart';

import type { ChartBuilderOutput, ChartTypeOutputInput } from '../../../model';

import { chartRowLimit } from '../../common/const';
import {
    axisConfigToDraftFields,
    buildGrouping,
    buildMeasure,
    createFilterResult,
    createMeasureDraft,
    getActiveAnalysisColumnId,
    getActiveMeasure,
    getGroupingModes,
    isAnalysisColumnEnabled,
    measureConfigToDraft,
    normalizeGroupingMode,
    validateMeasureColumns,
} from '../../common/model';
import { createLineChartDraft, type LineChartDraft } from './lineChartConfig';

export const configToLineChartDraft = (config: ChartConfig): LineChartDraft => {
    if (config.kind !== 'line') {
        return createLineChartDraft();
    }

    const dimension = axisConfigToDraftFields(config.dimension);
    const filter = config.filters?.[0];

    return {
        dimensionColumnId: dimension.columnId,
        dimensionGroupingMode: dimension.groupingMode,
        dimensionGranularity: dimension.granularity,
        dimensionStep: dimension.step,
        measures: config.measures.length
            ? config.measures.map(measureConfigToDraft)
            : [createMeasureDraft()],
        breakdownEnabled: Boolean(config.series),
        breakdownColumnId: config.series?.columnId ?? '',
        breakdownTopN: config.series?.topN ?? 8,
        filterEnabled: Boolean(filter),
        filterColumnId: filter?.columnId ?? '',
        filterOperation: filter?.op ?? 'eq',
        filterValue: Array.isArray(filter?.value)
            ? filter.value.join(', ')
            : String(filter?.value ?? ''),
    };
};

export const createLineChartOutput = ({
    draft,
    appearance,
    columns,
    editMode,
}: ChartTypeOutputInput<LineChartDraft>): ChartBuilderOutput => {
    const activeDimensionColumnId = getActiveAnalysisColumnId(
        columns,
        draft.dimensionColumnId,
        editMode
    );
    const activeDimensionColumn = columns.find(
        column => column.id === activeDimensionColumnId
    );
    const groupingMode = normalizeGroupingMode(
        draft.dimensionGroupingMode,
        getGroupingModes(activeDimensionColumn?.dataType)
    );
    const activeMeasures = draft.measures.map((measure, index) =>
        getActiveMeasure(columns, measure.aggregate, measure.columnId, editMode, index)
    );
    const activeBreakdownColumnId = getActiveAnalysisColumnId(
        columns,
        draft.breakdownColumnId,
        editMode
    );

    if (
        !activeDimensionColumnId ||
        !isAnalysisColumnEnabled(columns, activeDimensionColumnId) ||
        !validateMeasureColumns(draft.measures, activeMeasures) ||
        (draft.breakdownEnabled &&
            (!activeBreakdownColumnId ||
                !isAnalysisColumnEnabled(columns, activeBreakdownColumnId)))
    ) {
        return {
            ...appearance,
            config: null,
            error: 'Choose columns included in analysis for this chart.',
            canPreview: false,
        };
    }

    const filterResult = createFilterResult({
        columns,
        editMode,
        enabled: draft.filterEnabled,
        columnId: draft.filterColumnId,
        operation: draft.filterOperation,
        value: draft.filterValue,
    });

    if (filterResult.error) {
        return {
            ...appearance,
            config: null,
            error: filterResult.error,
            canPreview: false,
        };
    }

    const config: LineChartConfig = {
        kind: 'line',
        limit: chartRowLimit,
        style: { color: normalizeChartColor(appearance.chartColor) },
        orderBy: { ref: 'dim', index: 0, dir: 'asc' },
        dimension: {
            columnId: activeDimensionColumnId,
            ...(groupingMode !== 'none'
                ? {
                      grouping: buildGrouping(
                          groupingMode,
                          draft.dimensionGranularity,
                          draft.dimensionStep
                      ),
                  }
                : {}),
        },
        ...(draft.breakdownEnabled
            ? {
                  series: {
                      columnId: activeBreakdownColumnId,
                      topN: draft.breakdownTopN,
                  },
              }
            : {}),
        ...(filterResult.filter ? { filters: [filterResult.filter] } : {}),
        measures: draft.measures.map((measure, index) =>
            buildMeasure({
                ...measure,
                columnId: activeMeasures[index]?.activeColumnId ?? '',
            })
        ),
    };

    return {
        ...appearance,
        config,
        error: '',
        canPreview: true,
    };
};
