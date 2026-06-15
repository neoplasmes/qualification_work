import type { ChartConfig, PieChartConfig } from '@qualification-work/types';

import { normalizeChartColor } from '@/entities/chart';

import type { ChartBuilderOutput, ChartTypeOutputInput } from '../../../model';

import { chartRowLimit } from '../../common/const';
import {
    axisConfigToDraftFields,
    buildMeasure,
    createFilterResult,
    createMeasureDraft,
    getActiveAnalysisColumnId,
    getActiveMeasure,
    isAnalysisColumnEnabled,
    measureConfigToDraft,
    validateMeasureColumn,
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
        measureAggregate: measure.aggregate,
        measureColumnId: measure.columnId,
        measureValueFormat: measure.valueFormat,
        topN: config.slice.topN ?? 12,
        filterEnabled: Boolean(filter),
        filterColumnId: filter?.columnId ?? '',
        filterOperation: filter?.op ?? 'eq',
        filterValue: Array.isArray(filter?.value)
            ? filter.value.join(', ')
            : String(filter?.value ?? ''),
    };
};

export const createPieChartOutput = ({
    draft,
    appearance,
    columns,
    editMode,
}: ChartTypeOutputInput<PieChartDraft>): ChartBuilderOutput => {
    const activeDimensionColumnId = getActiveAnalysisColumnId(
        columns,
        draft.dimensionColumnId,
        editMode
    );
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

    if (
        !activeDimensionColumnId ||
        !isAnalysisColumnEnabled(columns, activeDimensionColumnId) ||
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
