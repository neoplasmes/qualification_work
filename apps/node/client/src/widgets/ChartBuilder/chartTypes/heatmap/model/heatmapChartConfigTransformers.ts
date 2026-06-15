import type { ChartConfig, HeatmapChartConfig } from '@qualification-work/types';

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
    validateMeasureColumn,
} from '../../common/model';
import { createHeatmapChartDraft, type HeatmapChartDraft } from './heatmapChartConfig';

export const configToHeatmapChartDraft = (config: ChartConfig): HeatmapChartDraft => {
    if (config.kind !== 'heatmap') {
        return createHeatmapChartDraft();
    }

    const x = axisConfigToDraftFields(config.x);
    const y = axisConfigToDraftFields(config.y);
    const measure = measureConfigToDraft(config.measure);
    const filter = config.filters?.[0];

    return {
        xColumnId: x.columnId,
        xGroupingMode: x.groupingMode,
        xGranularity: x.granularity,
        xStep: x.step,
        yColumnId: y.columnId,
        yGroupingMode: y.groupingMode,
        yGranularity: y.granularity,
        yStep: y.step,
        measureAggregate: measure.aggregate,
        measureColumnId: measure.columnId,
        measureValueFormat: measure.valueFormat,
        filterEnabled: Boolean(filter),
        filterColumnId: filter?.columnId ?? '',
        filterOperation: filter?.op ?? 'eq',
        filterValue: Array.isArray(filter?.value)
            ? filter.value.join(', ')
            : String(filter?.value ?? ''),
    };
};

export const createHeatmapChartOutput = ({
    draft,
    appearance,
    columns,
    editMode,
}: ChartTypeOutputInput<HeatmapChartDraft>): ChartBuilderOutput => {
    const activeXColumnId = getActiveAnalysisColumnId(columns, draft.xColumnId, editMode);
    const activeYColumnId = getActiveAnalysisColumnId(
        columns,
        draft.yColumnId,
        editMode,
        1
    );
    const activeXColumn = columns.find(column => column.id === activeXColumnId);
    const activeYColumn = columns.find(column => column.id === activeYColumnId);
    const xGroupingModes = getGroupingModes(activeXColumn?.dataType);
    const yGroupingModes = getGroupingModes(activeYColumn?.dataType);
    const xGroupingMode = normalizeGroupingMode(draft.xGroupingMode, xGroupingModes);
    const yGroupingMode = normalizeGroupingMode(draft.yGroupingMode, yGroupingModes);
    const measure = createMeasureDraft({
        aggregate: draft.measureAggregate,
        columnId: draft.measureColumnId,
        valueFormat: draft.measureValueFormat,
    });
    const activeMeasure = getActiveMeasure(
        columns,
        draft.measureAggregate,
        draft.measureColumnId,
        editMode
    );

    if (activeXColumnId && activeXColumnId === activeYColumnId) {
        return {
            ...appearance,
            config: null,
            error: 'X and Y axes must be different columns.',
            canPreview: false,
        };
    }

    if (
        !activeXColumnId ||
        !activeYColumnId ||
        !isAnalysisColumnEnabled(columns, activeXColumnId) ||
        !isAnalysisColumnEnabled(columns, activeYColumnId) ||
        !validateMeasureColumn(measure, activeMeasure)
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

    const config: HeatmapChartConfig = {
        kind: 'heatmap',
        limit: chartRowLimit,
        style: { color: normalizeChartColor(appearance.chartColor) },
        x: {
            columnId: activeXColumnId,
            ...(xGroupingMode !== 'none'
                ? {
                      grouping: buildGrouping(
                          xGroupingMode,
                          draft.xGranularity,
                          draft.xStep
                      ),
                  }
                : {}),
        },
        y: {
            columnId: activeYColumnId,
            ...(yGroupingMode !== 'none'
                ? {
                      grouping: buildGrouping(
                          yGroupingMode,
                          draft.yGranularity,
                          draft.yStep
                      ),
                  }
                : {}),
        },
        ...(filterResult.filter ? { filters: [filterResult.filter] } : {}),
        measure: buildMeasure({
            ...measure,
            columnId: activeMeasure.activeColumnId,
        }),
    };

    return {
        ...appearance,
        config,
        error: '',
        canPreview: true,
    };
};
