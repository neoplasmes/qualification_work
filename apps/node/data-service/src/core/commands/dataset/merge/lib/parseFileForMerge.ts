import { ValidationError } from '@qualification-work/microservice-utils/errors';
import type { ColumnDataType } from '@qualification-work/types';

import type { MergeSessionFile } from '@/core/ports/driven/repos';
import type {
    DatasetParserTool,
    ResolvedDatasetParser,
    SavedTmpFile,
    TmpFileStorageTool,
} from '@/core/ports/driven/tools';

import { inferDatasetTypes } from '../../lib';
import { buildTupleKey } from './buildTupleKey';

const PREVIEW_ROWS_FOR_INFER = 10;

export type ParsedMergeFile = {
    file: MergeSessionFile;
    inferredColumns: Array<{ key: string; dataType: ColumnDataType }>;
    /** mergeKey tuple -> raw row data. populated only when mergeKeys.length > 0 */
    rowsByTuple: Map<string, Record<string, unknown>>;
};

/**
 * fully reads a saved file: collects columns, total row count, and per-tuple rows for the merge step.
 * throws if a duplicate merge tuple is found inside the file or if any merge-key cell is empty
 *
 * @param saved
 * @param resolved
 * @param storage
 * @param mergeKeys
 * @param maxRowsAllowed total rows across this and previous files allowed in memory
 * @param alreadyLoadedRows rows already pulled into memory from previous files - to check the limit
 * @returns
 */
export async function parseFileForMerge(
    saved: SavedTmpFile,
    resolved: ResolvedDatasetParser,
    storage: TmpFileStorageTool,
    mergeKeys: string[],
    maxRowsAllowed: number,
    alreadyLoadedRows: number
): Promise<ParsedMergeFile> {
    const stream = storage.openFile(saved.path);
    const rowStream = (
        resolved.parser as DatasetParserTool
    ).parseFileDataToJSObjectsStream(stream);

    const previewRows: Array<Record<string, unknown>> = [];
    const rowsByTuple = new Map<string, Record<string, unknown>>();
    const allColumnKeys = new Set<string>();
    let rowCount = 0;

    for await (const raw of rowStream) {
        const row = raw as Record<string, unknown>;

        if (previewRows.length < PREVIEW_ROWS_FOR_INFER) {
            previewRows.push(row);
        }

        for (const k of Object.keys(row)) {
            allColumnKeys.add(k);
        }

        if (mergeKeys.length > 0) {
            for (const mk of mergeKeys) {
                const v = row[mk];
                if (v === null || v === undefined || v === '') {
                    throw new ValidationError(
                        [mk],
                        `merge key "${mk}" is empty in file "${saved.originalName}" at row ${rowCount}`
                    );
                }
            }

            const tuple = buildTupleKey(row, mergeKeys);
            if (rowsByTuple.has(tuple)) {
                throw new ValidationError(
                    mergeKeys,
                    `duplicate merge key in file "${saved.originalName}" at row ${rowCount}`
                );
            }

            rowsByTuple.set(tuple, row);
        }

        rowCount += 1;

        if (
            Number.isFinite(maxRowsAllowed) &&
            alreadyLoadedRows + rowCount > maxRowsAllowed
        ) {
            throw new ValidationError(
                [],
                `too many rows to merge in memory, limit is ${maxRowsAllowed}`
            );
        }
    }

    if (rowCount === 0) {
        throw new ValidationError([], `file "${saved.originalName}" is empty`);
    }

    const inferred = inferDatasetTypes(previewRows);

    // make sure every column observed during streaming is represented, fall back to string
    const inferredByKey = new Map(inferred.map(c => [c.key, c.dataType]));
    const columns: Array<{ key: string; dataType: ColumnDataType }> = [];
    for (const key of allColumnKeys) {
        columns.push({ key, dataType: inferredByKey.get(key) ?? 'string' });
    }

    return {
        file: {
            fileIndex: saved.fileIndex,
            originalName: saved.originalName,
            path: saved.path,
            sourceType: resolved.sourceType,
            rowCount,
            columnKeys: Array.from(allColumnKeys),
        },
        inferredColumns: columns,
        rowsByTuple,
    };
}
