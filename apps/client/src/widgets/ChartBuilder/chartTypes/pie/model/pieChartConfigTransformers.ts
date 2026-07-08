import type { ChartConfig, PieChartConfig } from '@qualification-work/types';

import { normalizeChartColor } from '@/entities/chart';

import type { ChartBuilderOutput, ChartTypeOutputInput } from '../../../model';

import { chartRowLimit } from '../../common/const';
import {
    axisConfigToDraftFields,
    buildMeasure,
    createFilterResult,
    createMeasureDraft,
    getAcceptableColumnsForSelectedAggregationType,
    getActiveAnalysisColumnId,
    isAnalysisColumnEnabled,
    measureConfigToDraft,
    validateMeasureColumns,
} from '../../common/model';
import { createPieChartDraft, type PieChartDraft } from './pieChartConfig';

export const configToPieChartDraft = (config: ChartConfig): PieChartDraft => {
    if (config.kind !== 'pie') {
        return createPieChartDraft();
    }

    const dimension = axisConfigToDraftFields({
        columnId: config.slice.columnId,
    });
    const measure = measureConfigToDraft(config.measure);
    const filter = config.filters?.[0];

    return {
        dimensionColumnId: dimension.columnId,
        dimensionGroupingMode: dimension.groupingMode,
        dimensionGranularity: dimension.granularity,
        dimensionStep: dimension.step,
        measures: [measure],
        topN: config.slice.topN ?? 12,
        filterEnabled: Boolean(filter),
        filterColumnId: filter?.columnId ?? '',
        filterOperation: filter?.op ?? 'eq',
        filterValue: Array.isArray(filter?.value)
            ? filter.value.join(', ')
            : String(filter?.value ?? ''),
    };
};

export const draftToPieChartBuilderOutput = ({
    draft,
    appearance,
    columns,
    editMode,
}: ChartTypeOutputInput<PieChartDraft>): ChartBuilderOutput<PieChartConfig> => {
    const activeDimensionColumnId = getActiveAnalysisColumnId(
        columns,
        draft.dimensionColumnId,
        editMode
    );
    const measure = draft.measures[0] ?? createMeasureDraft();
    const acceptableMeasureColumns = getAcceptableColumnsForSelectedAggregationType(
        columns,
        measure.aggregate,
        measure.columnId,
        editMode
    );

    if (
        !activeDimensionColumnId ||
        !isAnalysisColumnEnabled(columns, activeDimensionColumnId) ||
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

    const config: PieChartConfig = {
        kind: 'pie',
        limit: chartRowLimit,
        style: { color: normalizeChartColor(appearance.chartColor) },
        slice: {
            columnId: activeDimensionColumnId,
            topN: draft.topN,
            otherBucket: true,
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
