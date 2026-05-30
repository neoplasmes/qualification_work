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
    columns.some(column => (values[column.key] ?? '').trim() !== '') &&
    columns.every(column => {
        const raw = values[column.key] ?? '';

        return raw === '' || isValidDatasetCellValue(raw, column.dataType);
    });
