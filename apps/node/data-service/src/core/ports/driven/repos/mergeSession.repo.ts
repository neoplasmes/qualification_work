import type {
    ColumnDataType,
    DatasetFileSourceType,
    MergeMode,
} from '@qualification-work/types';

export type { MergeMode };

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
    mode: MergeMode;
    createNew: boolean;
    /** selected/source dataset, null only for legacy "new from uploaded files" flow */
    sourceDatasetId: string | null;
    /** kept for compatibility with existing session consumers */
    datasetId: string | null;
    /** name for the new dataset when createNew=true */
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
