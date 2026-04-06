import type { DatasetColumn } from '@/core/entities/dataset';

export type CreateDatasetPayload = {
    orgId: string;
    name: string;
    // TODO: create enum or smth and reuse across the codebase. This is not the only place where source types are used
    sourceType: 'csv' | 'xlsx' | 'manual';
    columns: Array<Omit<DatasetColumn, 'id' | 'datasetId'>>;
};

export interface DatasetRepository {
    /**
     * function that gets dataset metadata (columns and etc) and callback function to
     * i don't how to even explain this
     *
     * @param {CreateDatasetPayload} data
     * @param forwardRowsWithIndex
     * @returns {Promise<{ id: string }>}
     */
    createCompleteDataset(
        data: CreateDatasetPayload,
        forwardRowsWithIndex: (
            insertRow: (
                index: number,
                jsObjectsRowData: Record<string, unknown>
            ) => Promise<void>
        ) => Promise<void>
    ): Promise<{ id: string }>;
}
