export type ColumnWidths = Record<string, number>;

// per-dataset table options, extensible (only widths for now)
export type DatasetTableOptions = {
    columnWidths: ColumnWidths;
};

export interface DatasetTableOptionsRepo {
    get(datasetId: string): Promise<DatasetTableOptions | undefined>;
    set(datasetId: string, options: DatasetTableOptions): Promise<void>;
    remove(datasetId: string): Promise<void>;
}
