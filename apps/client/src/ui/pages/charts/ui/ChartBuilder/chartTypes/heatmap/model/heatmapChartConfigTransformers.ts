import type { ChartConfig, HeatmapChartConfig } from '@/core/entities/chart';
import { normalizeChartColor } from '@/ui/widgets/ChartShell';

import type { ChartBuilderOutput, ChartTypeOutputInput } from '../../../model';

import { chartRowLimit } from '../../common/const';
import {
    axisConfigToDraftFields,
    buildGrouping,
    buildMeasure,
    createFilterResult,
    createMeasureDraft,
    getAcceptableColumnsForSelectedAggregationType,
    getActiveAnalysisColumnId,
    getGroupingModes,
    isAnalysisColumnEnabled,
    measureConfigToDraft,
    validateMeasureColumns,
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
        measures: [measure],
        filterEnabled: Boolean(filter),
        filterColumnId: filter?.columnId ?? '',
        filterOperation: filter?.op ?? 'eq',
        filterValue: Array.isArray(filter?.value)
            ? filter.value.join(', ')
            : String(filter?.value ?? ''),
    };
};

export const draftToHeatmapChartBuilderOutput = ({
    draft,
    appearance,
    columns,
    editMode,
}: ChartTypeOutputInput<HeatmapChartDraft>): ChartBuilderOutput<HeatmapChartConfig> => {
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
    const xGroupingMode = xGroupingModes.includes(draft.xGroupingMode)
        ? draft.xGroupingMode
        : 'none';
    const yGroupingMode = yGroupingModes.includes(draft.yGroupingMode)
        ? draft.yGroupingMode
        : 'none';
    const measure = draft.measures[0] ?? createMeasureDraft();
    const acceptableMeasureColumns = getAcceptableColumnsForSelectedAggregationType(
        columns,
        measure.aggregate,
        measure.columnId,
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
        !validateMeasureColumns(measure, [acceptableMeasureColumns])
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
            columnId: acceptableMeasureColumns.activeColumnId,
        }),
    };

    return {
        ...appearance,
        config,
        error: '',
        canPreview: true,
    };
};
