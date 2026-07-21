import type { Dataset } from '@/core/entities/dataset';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';

import type { ReadOptions } from '../readOptions';

export interface DatasetMetadata {
    dataset: Dataset;
    columns: DatasetColumn[];
    totalRows: number;
}
export interface DatasetRowsPage {
    rows: DatasetRow[];
    totalRows: number;
    offset: number;
    limit: number;
}
export type ListDatasetsInput = { orgId: string };
export type DatasetScope = { orgId: string; datasetId: string };
export type GetDatasetRowsInput = DatasetScope & { offset?: number; limit?: number };
export type PatchDatasetInput = DatasetScope & { name: string };
export type PatchDatasetColumnInput = DatasetScope & {
    columnId: string;
    isAnalyzable: boolean;
};
export type UpdateDatasetRowsInput = DatasetScope & {
    rowIds: string[];
    values: Record<string, unknown>;
};
export type InsertDatasetRowInput = DatasetScope & {
    afterRowId?: string;
    data: Record<string, unknown>;
};
export type DeleteDatasetRowsInput = DatasetScope & { rowIds: string[] };

export interface DatasetRepo {
    listDatasets(
        input: ListDatasetsInput,
        options?: ReadOptions
    ): Promise<DatasetMetadata[]>;
    getDatasetMetadata(
        input: DatasetScope,
        options?: ReadOptions
    ): Promise<DatasetMetadata>;
    getDatasetRows(
        input: GetDatasetRowsInput,
        options?: ReadOptions
    ): Promise<DatasetRowsPage>;
    deleteDataset(input: DatasetScope): Promise<void>;
    patchDataset(input: PatchDatasetInput): Promise<void>;
    patchDatasetColumn(input: PatchDatasetColumnInput): Promise<DatasetColumn>;
    updateDatasetRows(input: UpdateDatasetRowsInput): Promise<DatasetRow[]>;
    insertDatasetRow(input: InsertDatasetRowInput): Promise<DatasetRow>;
    deleteDatasetRows(input: DeleteDatasetRowsInput): Promise<DatasetRow[]>;
}
