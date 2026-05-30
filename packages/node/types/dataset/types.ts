import type {
    datasetColumnDataTypes,
    datasetFileSourceTypes,
    datasetSourceTypes,
    mergeModes,
} from './const.js';

export type DatasetSourceType = (typeof datasetSourceTypes)[number];

export type DatasetFileSourceType = (typeof datasetFileSourceTypes)[number];

export type ColumnDataType = (typeof datasetColumnDataTypes)[number];

export type DatasetDB = {
    id: string;
    orgId: string;
    name: string;
    sourceType: DatasetSourceType;
    createdAt: Date;
    updatedAt: Date;
};

export type DatasetResponse = Omit<DatasetDB, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export type DatasetColumn = {
    id: string;
    datasetId: string;
    key: string;
    displayName: string;
    dataType: ColumnDataType;
    orderIndex: number;
    isAnalyzable: boolean;
};

export type DatasetColumnInput = Omit<
    DatasetColumn,
    'id' | 'datasetId' | 'isAnalyzable'
> &
    Partial<Pick<DatasetColumn, 'isAnalyzable'>>;

export type DatasetMetadataResponse = {
    dataset: DatasetResponse;
    columns: DatasetColumn[];
    totalRows: number;
};

export type DatasetMetadataDB = {
    dataset: DatasetDB;
    columns: DatasetColumn[];
    totalRows: number;
};

export type DatasetRow = {
    id: string;
    datasetId: string;
    rowIndex: number;
    data: Record<string, unknown>;
};

export type DatasetRowsPageResponse = {
    rows: DatasetRow[];
    totalRows: number;
    offset: number;
    limit: number;
};

export type CreateDatasetPayload = {
    orgId: string;
    name: string;
    sourceType: DatasetSourceType;
    columns: DatasetColumnInput[];
};

export type PatchDatasetPayload = {
    name?: string;
};

export type PatchDatasetColumnPayload = {
    isAnalyzable: boolean;
};

export type GetDatasetRowsPayload = {
    datasetId: string;
    offset: number;
    limit: number;
};

export type UpdateDatasetRowPayload = {
    values: Record<string, unknown>;
};

export type InsertDatasetRowPayload = {
    afterRowId?: string;
    data: Record<string, unknown>;
};

export type MergeMode = (typeof mergeModes)[number];

export type MergeConflict = {
    rowKey: Record<string, unknown>;
    column: string;
    oldValue: unknown;
    newValue: unknown;
};

export type MergePreviewStatistics = {
    totalFiles: number;
    totalIncomingRows: number;
    totalNewRows: number;
    totalDuplicateRows: number;
    existingRowCount: number;
    copiedRows: number;
    newColumns: Array<{ key: string; displayName?: string; dataType: ColumnDataType }>;
    commonColumns: string[];
};

export type MergePreviewResult = {
    sessionId: string;
    expiresInSeconds: number;
    statistics: MergePreviewStatistics;
    conflicts: MergeConflict[];
};

export type CommitMergeResult = {
    datasetId: string;
    insertedRows: number;
    updatedRows: number;
    skippedDuplicates: number;
    copiedRows: number;
};

export type Dataset = DatasetResponse;

export type DatasetMetadata = DatasetMetadataResponse;

export type DatasetRowsPage = DatasetRowsPageResponse;
