import type { DatasetColumn } from '@/entities/dataset';

import { isValidDatasetCellValue, parseDatasetCellValue } from './datasetCellValue';

export const getInsertRowData = (
    columns: DatasetColumn[],
    values: Record<string, string>
) =>
    columns.reduce<Record<string, unknown>>((acc, column) => {
        const raw = values[column.key] ?? '';

        if (raw !== '') {
            acc[column.key] = parseDatasetCellValue(raw, column.dataType);
        }

        return acc;
    }, {});

export const isInsertRowValid = (
    columns: DatasetColumn[],
    values: Record<string, string>
) =>
    columns.length > 0 &&
    columns.every(column =>
        isValidDatasetCellValue(values[column.key] ?? '', column.dataType)
    );
