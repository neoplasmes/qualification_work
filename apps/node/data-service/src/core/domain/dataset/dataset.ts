export type Dataset = {
    id: string;
    orgId: string;
    name: string;
    // TODO: create enum or smth and reuse across the codebase. This is not the only place where source types are used
    sourceType: 'csv' | 'xlsx' | 'manual';
    createdAt: Date;
    updatedAt: Date;
};

export type ColumnDataType = 'number' | 'string' | 'date' | 'bool';

// database entity for a dataset column
export type DatasetColumn = {
    id: string;
    datasetId: string;
    key: string;
    displayName: string;
    dataType: ColumnDataType;
    orderIndex: number;
};

// database entity for a dataset row
export type DatasetRow = {
    id: string;
    datasetId: string;
    rowIndex: number;
    data: Record<string, unknown>;
};
