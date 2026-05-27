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
    newColumns: Array<{ key: string; displayName?: string; dataType: string }>;
    commonColumns: string[];
};

export type MergePreviewResult = {
    sessionId: string;
    expiresInSeconds: number;
    statistics: MergePreviewStatistics;
    conflicts: MergeConflict[];
};

export type MergeCommitResult = {
    datasetId: string;
    insertedRows: number;
    updatedRows: number;
    skippedDuplicates: number;
    copiedRows: number;
};
