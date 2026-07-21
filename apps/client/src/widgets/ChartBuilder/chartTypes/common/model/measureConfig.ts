import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { Aggregate, Measure } from '@qualification-work/types';

import type { ConfigBind } from '@/shared/ui/tools/Config';

import {
    getActiveAnalysisColumnId,
    isAnalysisColumnEnabled,
} from './analysisColumnConfig';

/**
 * maximum number of value series supported by multi-measure charts
 */
export const maxMeasures = 6;

// TODO: implement aliases somewhere in the future
/**
 * flat draft shape used by measure settings
 */
export type MeasureDraft = Required<Omit<Measure, 'alias'>>;

/**
 * connects measure controls to a measure list item
 *
 * @template T draft shape with a measures list
 * @param index
 * @param activeColumnId
 * @returns
 */
export const createMeasureBinds = <T extends { measures: MeasureDraft[] }>(
    index: number,
    activeColumnId: string
) => ({
    aggregate: {
        get: draft => draft.measures[index]?.aggregate ?? 'count',
        set: (draft, aggregate) => {
            const measure = draft.measures[index];

            if (measure) {
                measure.aggregate = aggregate;
            }
        },
    } satisfies ConfigBind<T, Aggregate>,
    columnId: {
        get: draft => activeColumnId || draft.measures[index]?.columnId || '',
        set: (draft, columnId) => {
            const measure = draft.measures[index];

            if (measure) {
                measure.columnId = columnId;
            }
        },
    } satisfies ConfigBind<T, string>,
    valueFormat: {
        get: draft => draft.measures[index]?.valueFormat ?? '',
        set: (draft, valueFormat) => {
            const measure = draft.measures[index];

            if (measure) {
                measure.valueFormat = valueFormat;
            }
        },
    } satisfies ConfigBind<T, string>,
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
 * measure columns accepted by the selected aggregation
 */
export type AcceptableMeasureColumns = {
    columns: DatasetColumn[];
    activeColumnId: string;
};

/**
 * returns columns accepted by the selected aggregation
 *
 * activeColumnId is returned to be used as a kind of auto-selection,
 * especially, when draft is blank at start and when acceptable type of columns is changed
 *
 * @param columns
 * @param aggregate
 * @param columnId
 * @param editMode
 * @param fallbackIndex
 * @returns
 */
export const getAcceptableColumnsForSelectedAggregationType = (
    columns: DatasetColumn[],
    aggregate: Aggregate,
    columnId: string,
    editMode: boolean,
    fallbackIndex = 0
): AcceptableMeasureColumns => {
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
 * checks that configured measures are valid; part of draft validation before sending over HTTP to backend
 *
 * @param selectedMeasures
 * @param acceptableColumnsForMeasures
 * @returns
 */
export const validateMeasureColumns = (
    selectedMeasures: MeasureDraft | MeasureDraft[],
    acceptableColumnsForMeasures: AcceptableMeasureColumns[]
) => {
    const measures = Array.isArray(selectedMeasures)
        ? selectedMeasures
        : [selectedMeasures];

    return measures.every((measure, index) => {
        const acceptableColumns = acceptableColumnsForMeasures[index];

        return (
            measure.aggregate === 'count' ||
            (Boolean(acceptableColumns?.activeColumnId) &&
                isAnalysisColumnEnabled(
                    acceptableColumns?.columns ?? [],
                    acceptableColumns?.activeColumnId ?? ''
                ))
        );
    });
};

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
    valueFormat?: string;
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
