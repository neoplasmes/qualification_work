import type { ColumnDataType } from '@/core/domain';

import type { DatasetFileSourceType } from '@/core/ports/driven/tools/datasetParser.tool';

export type MergeSessionFile = {
    fileIndex: number;
    originalName: string;
    path: string;
    sourceType: DatasetFileSourceType;
    rowCount: number;
    columnKeys: string[];
};

export type MergeSessionColumn = {
    key: string;
    displayName: string;
    dataType: ColumnDataType;
    orderIndex: number;
    isNew: boolean;
};

export type MergeSession = {
    sessionId: string;
    orgId: string;
    userId: string;
    /** null when a brand-new dataset is being created from N files */
    datasetId: string | null;
    /** name for the new dataset (null when datasetId is present) */
    name: string | null;
    mergeKeys: string[];
    files: MergeSessionFile[];
    unionColumns: MergeSessionColumn[];
    createdAt: string;
};

export interface MergeSessionRepo {
    save(session: MergeSession, ttlSeconds: number): Promise<void>;
    get(sessionId: string): Promise<MergeSession | null>;
    delete(sessionId: string): Promise<void>;
    listSessionIds(): Promise<string[]>;
}
