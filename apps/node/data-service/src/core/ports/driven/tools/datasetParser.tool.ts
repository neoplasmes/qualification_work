import type { Readable } from 'node:stream';

export type DatasetFileSourceType = 'csv' | 'xlsx';

export type ResolvedDatasetParser = {
    parser: DatasetParserTool;
    sourceType: DatasetFileSourceType;
};

/**
 * Returns the appropriate dataset parser based on the file's mimetype and filename.
 *
 * @export
 */
export type ResolveDatasetParser = (
    mimetype: string,
    filename: string
) => ResolvedDatasetParser | null;

/**
 * A tool responsible for parsing dataset files to JS objects and providing a stream of parsed rows, one by one
 *
 * @export
 * @interface DatasetParserTool
 */
export interface DatasetParserTool {
    /**
     * reads from file stream -> returns another stream with parsed rows to be consumed by other things
     *
     * @param {Readable} fileStream stream of incoming file data
     * @returns {Readable} stream of parsed rows
     */
    parseFileDataToJSObjectsStream(fileStream: Readable): Readable;
}
