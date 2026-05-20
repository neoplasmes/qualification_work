export type Dataset = {
    id: string;
    orgId: string;
    name: string;
    sourceType: 'csv' | 'xlsx' | 'manual';
    createdAt: string;
    updatedAt: string;
};

export type DatasetColumn = {
    id: string;
    datasetId: string;
    key: string;
    displayName: string;
    dataType: 'number' | 'string' | 'date' | 'bool';
    orderIndex: number;
};

export type DatasetMetadata = {
    dataset: Dataset;
    columns: DatasetColumn[];
    totalRows: number;
};

export type DatasetRow = {
    id: string;
    datasetId: string;
    rowIndex: number;
    data: Record<string, unknown>;
};

export type DatasetRowsPage = {
    rows: DatasetRow[];
    totalRows: number;
    offset: number;
    limit: number;
};
