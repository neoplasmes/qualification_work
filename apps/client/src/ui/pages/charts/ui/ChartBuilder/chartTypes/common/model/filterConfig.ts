import type { FilterClause, FilterOperation } from '@/core/entities/chart';
import type { DatasetColumn } from '@/core/entities/datasetColumn';

import {
    getActiveAnalysisColumnId,
    isAnalysisColumnEnabled,
} from './analysisColumnConfig';

/**
 * flat draft shape used by filter settings
 */
export type FilterDraft = {
    enabled: boolean;
    columnId: string;
    operation: FilterOperation;
    value: string;
};

type FilterResultInput = FilterDraft & {
    columns: DatasetColumn[];
    editMode: boolean;
};

export type FilterResult = {
    error: string;
    filter: FilterClause | null;
};

/**
 * tells whether a filter operation does not need a user value
 */
export const isNullaryFilterOperation = (operation: FilterOperation) =>
    operation === 'is_null' || operation === 'not_null';

/**
 * resolves the selected filter column within columns allowed for analysis
 */
export const getActiveFilterColumn = (
    columns: DatasetColumn[],
    filter: FilterDraft,
    editMode: boolean
) => {
    const activeColumnId = getActiveAnalysisColumnId(columns, filter.columnId, editMode);

    return columns.find(column => column.id === activeColumnId);
};

/**
 * creates a filter clause or explains why the filter cannot be applied
 */
export const createFilterResult = ({
    columns,
    editMode,
    enabled,
    columnId,
    operation,
    value,
}: FilterResultInput): FilterResult => {
    if (!enabled) {
        return { error: '', filter: null };
    }

    const activeColumnId = getActiveAnalysisColumnId(columns, columnId, editMode);
    const activeColumn = columns.find(column => column.id === activeColumnId);

    if (!activeColumn || !isAnalysisColumnEnabled(columns, activeColumn.id)) {
        return {
            error: 'Выберите поля, включённые в анализ.',
            filter: null,
        };
    }

    if (operation === 'is_null' || operation === 'not_null') {
        return {
            error: '',
            filter: { columnId: activeColumn.id, op: operation },
        };
    }

    if (!value.trim()) {
        return {
            error: 'Укажите значение фильтра или отключите его.',
            filter: null,
        };
    }

    if (operation === 'between') {
        const parts = value
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);

        if (parts.length !== 2) {
            return {
                error: 'Для диапазона нужны два значения через запятую.',
                filter: null,
            };
        }

        return {
            error: '',
            filter: {
                columnId: activeColumn.id,
                op: operation,
                value: parts.map(part => {
                    if (activeColumn.dataType === 'number') {
                        return Number(part);
                    }

                    if (activeColumn.dataType === 'bool') {
                        return part.toLowerCase() === 'true';
                    }

                    return part;
                }),
            },
        };
    }

    if (operation === 'in' || operation === 'nin') {
        return {
            error: '',
            filter: {
                columnId: activeColumn.id,
                op: operation,
                value: value
                    .split(',')
                    .map(part => part.trim())
                    .filter(Boolean)
                    .map(part => {
                        if (activeColumn.dataType === 'number') {
                            return Number(part);
                        }

                        if (activeColumn.dataType === 'bool') {
                            return part.toLowerCase() === 'true';
                        }

                        return part;
                    }),
            },
        };
    }

    const trimmedValue = value.trim();

    if (activeColumn.dataType === 'number') {
        return {
            error: '',
            filter: {
                columnId: activeColumn.id,
                op: operation,
                value: Number(trimmedValue),
            },
        };
    }

    if (activeColumn.dataType === 'bool') {
        return {
            error: '',
            filter: {
                columnId: activeColumn.id,
                op: operation,
                value: trimmedValue.toLowerCase() === 'true',
            },
        };
    }

    return {
        error: '',
        filter: {
            columnId: activeColumn.id,
            op: operation,
            value: trimmedValue,
        },
    };
};
