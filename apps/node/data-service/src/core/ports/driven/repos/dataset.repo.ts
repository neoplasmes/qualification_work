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

// callback signature used by streaming inserts. shared with bulk append flow
export type InsertRowFn = (
    index: number,
    jsObjectsRowData: Record<string, unknown>
) => Promise<void>;

export type AppendRowsFn = (data: Record<string, unknown>) => Promise<void>;

export type DatasetUniquenessViolation = {
    keys: Record<string, unknown>;
    count: number;
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
        forwardRowsWithIndex: (insertRow: InsertRowFn) => Promise<void>
    ): Promise<{ id: string }>;

    /**
     * creates dataset + columns without inserting any rows. used by the two-phase merge flow
     *
     * @param data
     */
    createEmptyDataset(data: CreateDatasetPayload): Promise<{ id: string }>;

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

    /**
     * partial jsonb update of a single row. returns updated row or null if not found
     *
     * @param datasetId
     * @param rowId
     * @param partialData only keys in this object are written; missing keys stay untouched
     * @returns
     */
    updateRowValues(
        datasetId: string,
        rowId: string,
        partialData: Record<string, unknown>
    ): Promise<DatasetRow | null>;

    /**
     * appends one row with next available row_index. uses row-level lock to avoid race
     *
     * @param datasetId
     * @param data
     * @returns
     */
    insertRow(datasetId: string, data: Record<string, unknown>): Promise<DatasetRow>;

    /**
     * adds new columns to existing dataset, skipping ones whose key already exists
     *
     * @param datasetId
     * @param columns
     */
    addColumns(
        datasetId: string,
        columns: Array<Omit<DatasetColumn, 'id' | 'datasetId'>>
    ): Promise<void>;

    /**
     * finds first violation of compound uniqueness by selected column keys
     * returns null when each tuple is unique
     *
     * @param datasetId
     * @param mergeKeys
     */
    findDuplicateByMergeKeys(
        datasetId: string,
        mergeKeys: string[]
    ): Promise<DatasetUniquenessViolation | null>;

    /**
     * streams all rows of a dataset, calls cb for every loaded row.
     * stops and returns aborted=true when callback count exceeds abortIfMoreThan
     *
     * @param datasetId
     * @param abortIfMoreThan
     * @param cb
     */
    streamAllRows(
        datasetId: string,
        abortIfMoreThan: number,
        cb: (row: { rowId: string; data: Record<string, unknown> }) => void
    ): Promise<{ loaded: number; aborted: boolean }>;

    /**
     * bulk appends rows starting from current max(row_index)+1.
     * callback drives the stream by calling appendRow per row
     *
     * @param datasetId
     * @param forwardRows
     */
    bulkAppendRows(
        datasetId: string,
        forwardRows: (appendRow: AppendRowsFn) => Promise<void>
    ): Promise<{ insertedCount: number }>;
}
