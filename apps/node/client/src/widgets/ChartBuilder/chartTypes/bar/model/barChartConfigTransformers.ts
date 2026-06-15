import type { BarChartConfig, ChartConfig } from '@qualification-work/types';

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
import { createBarChartDraft, type BarChartDraft } from './barChartConfig';

export const configToBarChartDraft = (config: ChartConfig): BarChartDraft => {
    if (config.kind !== 'bar') {
        return createBarChartDraft();
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
        breakdownOtherBucket: config.series?.otherBucket ?? true,
        filterEnabled: Boolean(filter),
        filterColumnId: filter?.columnId ?? '',
        filterOperation: filter?.op ?? 'eq',
        filterValue: Array.isArray(filter?.value)
            ? filter.value.join(', ')
            : String(filter?.value ?? ''),
    };
};

export const createBarChartOutput = ({
    draft,
    appearance,
    columns,
    editMode,
}: ChartTypeOutputInput<BarChartDraft>): ChartBuilderOutput => {
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

    const config: BarChartConfig = {
        kind: 'bar',
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
                      otherBucket: draft.breakdownOtherBucket,
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
