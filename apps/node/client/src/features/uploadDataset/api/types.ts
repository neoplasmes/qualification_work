import type { DatasetColumn } from '@/entities/dataset';

export type MergeConflict = {
    rowKey: Record<string, unknown>;
    column: string;
    oldValue: unknown;
    newValue: unknown;
};

export type MergePreviewStatistics = {
    totalNewRows: number;
    totalDuplicateRows: number;
    newColumns: DatasetColumn[];
    commonColumns: string[];
    conflicts: MergeConflict[];
};

export type MergePreviewResult = {
    sessionId: string;
    expiresAt: string;
    statistics: MergePreviewStatistics;
};

export type MergeCommitResult = {
    datasetId: string;
    insertedRows: number;
    skippedDuplicates: number;
};
