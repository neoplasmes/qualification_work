import type { Readable } from 'node:stream';

export type SavedTmpFile = {
    fileIndex: number;
    originalName: string;
    path: string;
    sizeBytes: number;
};

export type TmpSessionStat = {
    sessionId: string;
    /** mtime of session dir */
    modifiedAt: Date;
};

/**
 * abstracts per-session temporary file storage used during the two-phase merge flow
 */
export interface TmpFileStorageTool {
    /**
     * creates the session directory if missing
     *
     * @param sessionId
     */
    ensureSessionDir(sessionId: string): Promise<void>;

    /**
     * streams an input file into the session directory under index-originalName name
     * rejects when maxBytes is exceeded (file is removed)
     *
     * @param sessionId
     * @param fileIndex
     * @param originalName
     * @param input
     * @param maxBytes
     */
    saveFile(
        sessionId: string,
        fileIndex: number,
        originalName: string,
        input: Readable,
        maxBytes: number
    ): Promise<SavedTmpFile>;

    /**
     * opens a saved file for reading
     *
     * @param filePath
     */
    openFile(filePath: string): Readable;

    /**
     * removes session directory recursively. idempotent
     *
     * @param sessionId
     */
    deleteSession(sessionId: string): Promise<void>;

    /**
     * lists session directories with their mtimes for cleanup
     */
    listSessions(): Promise<TmpSessionStat[]>;
}
