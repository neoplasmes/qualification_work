import type { ColumnDataType } from '@/core/domain';

export type MergePreviewStatistics = {
    totalFiles: number;
    totalIncomingRows: number;
    totalNewRows: number;
    totalDuplicateRows: number;
    existingRowCount: number;
    newColumns: Array<{ key: string; dataType: ColumnDataType }>;
    commonColumns: string[];
};

export type MergeConflict = {
    rowKey: Record<string, unknown>;
    column: string;
    oldValue: unknown;
    newValue: unknown;
};

export type MergePreviewResult = {
    sessionId: string;
    expiresInSeconds: number;
    statistics: MergePreviewStatistics;
    conflicts: MergeConflict[];
};

export const MAX_REPORTED_CONFLICTS = 10;
