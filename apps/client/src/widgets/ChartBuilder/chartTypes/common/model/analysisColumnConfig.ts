import type { DatasetColumn } from '@/entities/dataset';

/**
 * some columns are disabled from being included in charts definitions, so this function
 * filters such columns out
 */
export const getActiveAnalysisColumnId = (
    columns: DatasetColumn[],
    value: string,
    allowDisabledValue: boolean,
    fallbackIndex = 0
) => {
    const selected = columns.find(column => column.id === value);
    if (selected && (allowDisabledValue || selected.isAnalyzable !== false)) {
        return selected.id;
    }

    return (
        columns.slice(fallbackIndex).find(column => column.isAnalyzable !== false)?.id ??
        columns.find(column => column.isAnalyzable !== false)?.id ??
        ''
    );
};

/**
 * checks whether a selected column is still allowed for chart analysis
 */
export const isAnalysisColumnEnabled = (columns: DatasetColumn[], columnId: string) =>
    columns.find(column => column.id === columnId)?.isAnalyzable !== false;
