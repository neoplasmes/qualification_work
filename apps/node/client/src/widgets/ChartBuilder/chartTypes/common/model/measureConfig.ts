import type { Aggregate, Measure, MeasureValueFormat } from '@qualification-work/types';

import type { ConfigBind } from '@/features/Config';

import type { DatasetColumn } from '@/entities/dataset';

import {
    getActiveAnalysisColumnId,
    isAnalysisColumnEnabled,
} from './analysisColumnConfig';

/**
 * maximum number of value series supported by multi-measure charts
 */
export const maxMeasures = 6;

/**
 * flat draft shape used by measure settings
 */
export type MeasureDraft = {
    aggregate: Aggregate;
    valueFormat: MeasureValueFormat;
    columnId: string;
};

/**
 * measure column context after analysis-column filtering
 */
export type ActiveMeasure = {
    columns: DatasetColumn[];
    activeColumnId: string;
};

/**
 * connects one measure aggregate control to a measure list item
 *
 * @template T draft shape with a measures list
 */
export const createMeasureAggregateBind = <T extends { measures: MeasureDraft[] }>(
    index: number
): ConfigBind<T, Aggregate> => ({
    get: draft => draft.measures[index]?.aggregate ?? 'count',
    set: (draft, aggregate) => {
        const measure = draft.measures[index];

        if (measure) {
            measure.aggregate = aggregate;
        }
    },
});

/**
 * connects one measure column control to a measure list item
 *
 * @template T draft shape with a measures list
 */
export const createMeasureColumnIdBind = <T extends { measures: MeasureDraft[] }>(
    index: number,
    activeColumnId: string
): ConfigBind<T, string> => ({
    get: draft => activeColumnId || draft.measures[index]?.columnId || '',
    set: (draft, columnId) => {
        const measure = draft.measures[index];

        if (measure) {
            measure.columnId = columnId;
        }
    },
});

/**
 * connects one measure format control to a measure list item
 *
 * @template T draft shape with a measures list
 */
export const createMeasureValueFormatBind = <T extends { measures: MeasureDraft[] }>(
    index: number
): ConfigBind<T, MeasureValueFormat> => ({
    get: draft => draft.measures[index]?.valueFormat ?? '',
    set: (draft, valueFormat) => {
        const measure = draft.measures[index];

        if (measure) {
            measure.valueFormat = valueFormat;
        }
    },
});

/**
 * creates a stable default measure for a new or incomplete draft
 */
export const createMeasureDraft = (overrides?: Partial<MeasureDraft>): MeasureDraft => ({
    aggregate: 'count',
    valueFormat: '',
    columnId: '',
    ...overrides,
});

/**
 * tells whether the aggregate needs a real dataset column
 */
export const needsColumn = (aggregate: Aggregate) => aggregate !== 'count';

/**
 * resolves the selected measure column within columns allowed for the aggregate
 */
export const getActiveMeasure = (
    columns: DatasetColumn[],
    aggregate: Aggregate,
    columnId: string,
    editMode: boolean,
    fallbackIndex = 0
): ActiveMeasure => {
    const numericColumns = columns.filter(column => column.dataType === 'number');
    const measureColumns = aggregate === 'count_distinct' ? columns : numericColumns;

    return {
        columns: measureColumns,
        activeColumnId: getActiveAnalysisColumnId(
            measureColumns,
            columnId,
            editMode,
            fallbackIndex
        ),
    };
};

/**
 * checks that one measure uses a column available for chart analysis
 */
export const validateMeasureColumn = (
    measure: MeasureDraft,
    activeMeasure: ActiveMeasure
) =>
    !needsColumn(measure.aggregate) ||
    (Boolean(activeMeasure.activeColumnId) &&
        isAnalysisColumnEnabled(activeMeasure.columns, activeMeasure.activeColumnId));

/**
 * checks that every measure uses a column available for chart analysis
 */
export const validateMeasureColumns = (
    measures: MeasureDraft[],
    activeMeasures: ActiveMeasure[]
) =>
    measures.every((measure, index) =>
        validateMeasureColumn(
            measure,
            activeMeasures[index] ?? { columns: [], activeColumnId: '' }
        )
    );

/**
 * builds the output measure expected by chart rendering
 */
export const buildMeasure = ({
    aggregate,
    columnId,
    valueFormat,
}: MeasureDraft): Measure =>
    aggregate === 'count'
        ? {
              aggregate,
              ...(valueFormat.trim() ? { valueFormat: valueFormat.trim() } : {}),
          }
        : {
              aggregate,
              columnId,
              ...(valueFormat.trim() ? { valueFormat: valueFormat.trim() } : {}),
          };

/**
 * saved measure shape accepted when restoring chart settings
 */
type MeasureConfigLike = {
    aggregate?: Aggregate;
    columnId?: string;
    valueFormat?: MeasureValueFormat;
};

/**
 * converts a saved measure into the flat form draft
 */
export const measureConfigToDraft = (
    measure: MeasureConfigLike | undefined
): MeasureDraft => ({
    aggregate: measure?.aggregate ?? 'count',
    valueFormat: measure?.valueFormat ?? '',
    columnId: measure?.columnId ?? '',
});
