export type UploadHandle = {
    id: string;
    name: string;
    size: number;
    contentType: string;
};
export type UploadInput = { orgId: string; file: UploadHandle };
export type UploadResult = { id: string };
export type MergeInput = {
    orgId: string;
    datasetId?: string;
    name?: string;
    mode?: 'append' | 'merge';
    createNew?: boolean;
    mergeKeys: string[];
    files: UploadHandle[];
};
export type MergeSessionInput = { orgId: string; sessionId: string };
export type MergePreviewResult = {
    sessionId: string;
    expiresInMs: number;
    statistics: {
        totalFiles: number;
        totalIncomingRows: number;
        totalNewRows: number;
        totalDuplicateRows: number;
        existingRowCount: number;
        copiedRows: number;
        newColumns: {
            key: string;
            displayName?: string;
            dataType: 'number' | 'string' | 'date' | 'bool' | 'day_of_week';
        }[];
        commonColumns: string[];
    };
    conflicts: {
        rowKey: Record<string, unknown>;
        column: string;
        oldValue: unknown;
        newValue: unknown;
    }[];
};
export type CommitMergeResult = {
    datasetId: string;
    insertedRows: number;
    updatedRows: number;
    skippedDuplicates: number;
    copiedRows: number;
};
export interface UploadRepo {
    uploadDataset(input: UploadInput): Promise<UploadResult>;
    previewDatasetMerge(input: MergeInput): Promise<MergePreviewResult>;
    commitDatasetMerge(input: MergeSessionInput): Promise<CommitMergeResult>;
    cancelDatasetMerge(input: MergeSessionInput): Promise<void>;
}
