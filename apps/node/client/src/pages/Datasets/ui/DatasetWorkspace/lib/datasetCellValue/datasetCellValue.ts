import type { DatasetColumn } from '@/entities/dataset';

export type DatasetCellDataType = DatasetColumn['dataType'];

export type DatasetCellValueHandler = {
    isValid: (value: string) => boolean;
    parse: (value: string) => unknown;
    format: (value: unknown) => string;
};

export { datasetCellValueHandlers } from './datasetCellValueHandlers';
