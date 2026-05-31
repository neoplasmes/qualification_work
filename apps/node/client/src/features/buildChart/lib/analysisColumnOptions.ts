import type { DatasetColumn } from '@/entities/dataset';

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

export const isAnalysisColumnEnabled = (columns: DatasetColumn[], columnId: string) =>
    columns.find(column => column.id === columnId)?.isAnalyzable !== false;
