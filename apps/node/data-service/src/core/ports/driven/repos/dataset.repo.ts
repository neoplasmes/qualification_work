import type { Dataset, DatasetColumn, DatasetRow } from '@/core/domain';

export type CreateDatasetPayload = {
    orgId: string;
    name: string;
    // TODO: create enum or smth and reuse across the codebase. This is not the only place where source types are used
    sourceType: 'csv' | 'xlsx' | 'manual';
    columns: Array<Omit<DatasetColumn, 'id' | 'datasetId'>>;
};

export type DatasetMetadata = {
    dataset: Dataset;
    columns: DatasetColumn[];
    totalRows: number;
};

export type GetDatasetRowsPayload = {
    datasetId: string;
    offset: number;
    limit: number;
};

export type DatasetRowsPage = {
    rows: DatasetRow[];
    totalRows: number;
    offset: number;
    limit: number;
};

export interface DatasetRepo {
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

    /**
     * see the name
     *
     * @param {string} datasetId
     * @returns {Promise<DatasetMetadata | null>}
     */
    getDatasetMetadataByDatasetId(datasetId: string): Promise<DatasetMetadata | null>;

    /**
     * see the name
     *
     * @param {string} orgId
     * @returns {Promise<DatasetMetadata[]>}
     */
    getDatasetsMetadataByOrgId(orgId: string): Promise<DatasetMetadata[]>;

    /**
     * see the name
     *
     * @param {GetDatasetRowsPayload} data
     * @returns {Promise<DatasetRowsPage | null>}
     */
    getDatasetRowsPageById(data: GetDatasetRowsPayload): Promise<DatasetRowsPage | null>;

    deleteById(datasetId: string): Promise<void>;
}
