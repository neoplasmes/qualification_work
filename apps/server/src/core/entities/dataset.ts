export interface Dataset {
    id: string;
    orgId: string;
    name: string;
    // TODO: create enum or smth and reuse across the codebase. This is not the only place where source types are used
    sourceType: 'csv' | 'xlsx' | 'manual';
    createdAt: Date;
    updatedAt: Date;
}

export type ColumnDataType = 'number' | 'string' | 'date' | 'bool';

/**
 * it's a representation of a database entity
 *
 * @export
 * @interface DatasetColumn
 */
export interface DatasetColumn {
    id: string;
    datasetId: string;
    key: string;
    displayName: string;
    dataType: ColumnDataType;
    orderIndex: number;
}

/**
 * it's a representation of a database entity
 *
 * @export
 * @interface DatasetRow
 */
export interface DatasetRow {
    id: string;
    datasetId: string;
    rowIndex: number;
    data: Record<string, unknown>;
}
