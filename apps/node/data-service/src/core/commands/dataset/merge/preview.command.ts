import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils/errors';
import type { ColumnDataType } from '@qualification-work/types';

import type {
    DatasetRepo,
    MergeMode,
    MergeSession,
    MergeSessionColumn,
    MergeSessionRepo,
} from '@/core/ports/driven/repos';
import type {
    ResolveDatasetParser,
    SavedTmpFile,
    TmpFileStorageTool,
} from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { coerceValueByType } from '../lib';
import { buildTupleKey, parseFileForMerge, type ParsedMergeFile } from './lib';
import {
    MAX_REPORTED_CONFLICTS,
    type MergeConflict,
    type MergePreviewResult,
    type MergePreviewStatistics,
} from './types';

export type PreviewMergeInput = {
    sessionId: string;
    orgId: string;
    userId: string;
    datasetId: string | null;
    name: string | null;
    mode: MergeMode;
    createNew: boolean;
    mergeKeys: string[];
    savedFiles: SavedTmpFile[];
};

export type PreviewMergeConfig = {
    sessionTtlMs: number;
    maxMergeRowsInMemory: number;
    maxExistingRowsForMerge: number;
};

export class PreviewMergeCommand implements Executable<
    [PreviewMergeInput],
    Promise<MergePreviewResult>
> {
    constructor(
        private readonly datasetRepo: DatasetRepo,
        private readonly mergeSessionRepo: MergeSessionRepo,
        private readonly tmpStorage: TmpFileStorageTool,
        private readonly resolveParser: ResolveDatasetParser,
        private readonly config: PreviewMergeConfig
    ) {}

    async execute(input: PreviewMergeInput): Promise<MergePreviewResult> {
        if (input.savedFiles.length === 0) {
            throw new ValidationError([], 'no files were uploaded');
        }

        const mode = input.mode ?? 'merge';
        const createNew = input.createNew || input.datasetId === null;

        if (
            mode === 'merge' &&
            input.datasetId === null &&
            input.savedFiles.length > 1 &&
            input.mergeKeys.length === 0
        ) {
            throw new ValidationError(
                ['mergeKeys'],
                'mergeKeys are required when uploading multiple files into a new dataset'
            );
        }

        if (
            mode === 'merge' &&
            input.datasetId !== null &&
            input.mergeKeys.length === 0
        ) {
            throw new ValidationError(
                ['mergeKeys'],
                'mergeKeys are required when merging into an existing dataset'
            );
        }

        // step 1: parse all files
        const parsed: ParsedMergeFile[] = [];
        let totalParsedRows = 0;

        for (const saved of input.savedFiles) {
            const resolved = this.resolveParser(
                inferMime(saved.originalName),
                saved.originalName
            );
            if (!resolved) {
                throw new ValidationError(
                    [],
                    `unsupported file type: ${saved.originalName}`
                );
            }

            const p = await parseFileForMerge(
                saved,
                resolved,
                this.tmpStorage,
                mode === 'append' ? [] : input.mergeKeys,
                mode === 'append'
                    ? Number.POSITIVE_INFINITY
                    : this.config.maxMergeRowsInMemory,
                mode === 'append' ? 0 : totalParsedRows
            );

            parsed.push(p);
            totalParsedRows += p.file.rowCount;
        }

        if (mode === 'append' && input.datasetId === null) {
            const baseFile = parsed[0];
            if (!baseFile) {
                throw new ValidationError([], 'no files were uploaded');
            }

            const unionColumns = validateInitialAppendColumns(parsed);

            await this.mergeSessionRepo.save(
                {
                    sessionId: input.sessionId,
                    orgId: input.orgId,
                    userId: input.userId,
                    mode,
                    createNew: true,
                    sourceDatasetId: null,
                    datasetId: null,
                    name: input.name ?? getDatasetName(baseFile.file.originalName),
                    mergeKeys: [],
                    files: parsed.map(p => p.file),
                    unionColumns,
                    createdAt: new Date().toISOString(),
                },
                this.config.sessionTtlMs
            );

            return {
                sessionId: input.sessionId,
                expiresInMs: this.config.sessionTtlMs,
                statistics: {
                    totalFiles: parsed.length,
                    totalIncomingRows: totalParsedRows,
                    totalNewRows: totalParsedRows,
                    totalDuplicateRows: 0,
                    existingRowCount: 0,
                    copiedRows: 0,
                    newColumns: unionColumns.map(c => ({
                        key: c.key,
                        dataType: c.dataType,
                    })),
                    commonColumns: unionColumns.map(c => c.key),
                },
                conflicts: [],
            };
        }

        // step 2: ensure every mergeKey is present in every file
        if (input.mergeKeys.length > 0) {
            for (const p of parsed) {
                const keySet = new Set(p.file.columnKeys);
                for (const mk of input.mergeKeys) {
                    if (!keySet.has(mk)) {
                        throw new ValidationError(
                            [mk],
                            `merge key "${mk}" is missing in file "${p.file.originalName}"`
                        );
                    }
                }
            }
        }

        // step 3: no merge-key tuple overlap between files
        if (input.mergeKeys.length > 0 && parsed.length > 1) {
            const seenTuples = new Map<string, string>();
            for (const p of parsed) {
                for (const tuple of p.rowsByTuple.keys()) {
                    const prevFile = seenTuples.get(tuple);
                    if (prevFile) {
                        throw new ValidationError(
                            input.mergeKeys,
                            `merge key duplicated across files "${prevFile}" and "${p.file.originalName}"`
                        );
                    }
                    seenTuples.set(tuple, p.file.originalName);
                }
            }
        }

        // step 4: build union of columns across all files
        const unionByKey = new Map<string, { dataType: ColumnDataType }>();
        for (const p of parsed) {
            for (const col of p.inferredColumns) {
                if (!unionByKey.has(col.key)) {
                    unionByKey.set(col.key, { dataType: col.dataType });
                }
            }
        }

        // step 5: handle existing dataset
        let existingByKey = new Map<
            string,
            { dataType: ColumnDataType; displayName: string; orderIndex: number }
        >();
        let existingRowCount = 0;
        let maxExistingOrderIndex = -1;
        let sourceDatasetName: string | null = null;
        let sharedNonMerge: string[] = [];

        if (input.datasetId !== null) {
            const metadata = await this.datasetRepo.getDatasetMetadataByDatasetId(
                input.datasetId
            );

            if (!metadata) {
                throw new NotFoundError('dataset not found');
            }

            if (metadata.dataset.orgId !== input.orgId) {
                throw new ForbiddenError('dataset belongs to another organization');
            }

            sourceDatasetName = metadata.dataset.name;

            for (const c of metadata.columns) {
                existingByKey.set(c.key, {
                    dataType: c.dataType,
                    displayName: c.displayName,
                    orderIndex: c.orderIndex,
                });
                if (c.orderIndex > maxExistingOrderIndex) {
                    maxExistingOrderIndex = c.orderIndex;
                }
            }

            existingRowCount = metadata.totalRows;

            if (mode === 'append') {
                validateAppendColumns(parsed, existingByKey);

                const unionColumns = metadata.columns.map<MergeSessionColumn>(c => ({
                    key: c.key,
                    displayName: c.displayName,
                    dataType: c.dataType,
                    orderIndex: c.orderIndex,
                    isNew: false,
                }));
                const sessionName = createNew
                    ? (input.name ?? `${metadata.dataset.name} copy`)
                    : null;

                await this.mergeSessionRepo.save(
                    {
                        sessionId: input.sessionId,
                        orgId: input.orgId,
                        userId: input.userId,
                        mode,
                        createNew,
                        sourceDatasetId: input.datasetId,
                        datasetId: input.datasetId,
                        name: sessionName,
                        mergeKeys: [],
                        files: parsed.map(p => p.file),
                        unionColumns,
                        createdAt: new Date().toISOString(),
                    },
                    this.config.sessionTtlMs
                );

                return {
                    sessionId: input.sessionId,
                    expiresInMs: this.config.sessionTtlMs,
                    statistics: {
                        totalFiles: parsed.length,
                        totalIncomingRows: totalParsedRows,
                        totalNewRows: totalParsedRows,
                        totalDuplicateRows: 0,
                        existingRowCount,
                        copiedRows: createNew ? existingRowCount : 0,
                        newColumns: [],
                        commonColumns: unionColumns.map(c => c.key),
                    },
                    conflicts: [],
                };
            }

            for (const mk of input.mergeKeys) {
                if (!existingByKey.has(mk)) {
                    throw new ValidationError(
                        [mk],
                        `merge key "${mk}" is missing in existing dataset`
                    );
                }
            }

            const nonMergeUnion = [...unionByKey.keys()].filter(
                k => !input.mergeKeys.includes(k)
            );
            if (nonMergeUnion.length === 0) {
                throw new ValidationError(
                    [],
                    'new files contain only merge keys, nothing to merge'
                );
            }
            sharedNonMerge = nonMergeUnion.filter(k => existingByKey.has(k));

            const violation = await this.datasetRepo.findDuplicateByMergeKeys(
                input.datasetId,
                input.mergeKeys
            );
            if (violation) {
                throw new ConflictError(
                    `existing dataset is not unique by selected merge keys (${JSON.stringify(violation.keys)})`
                );
            }
        }

        // step 6: build assembled column list with ordering
        const unionColumns: MergeSessionColumn[] = [];
        // existing columns keep their order/types
        for (const [key, ex] of existingByKey) {
            unionColumns.push({
                key,
                displayName: ex.displayName,
                dataType: ex.dataType,
                orderIndex: ex.orderIndex,
                isNew: false,
            });
        }
        let nextOrder = maxExistingOrderIndex + 1;
        for (const [key, info] of unionByKey) {
            if (existingByKey.has(key)) {
                continue;
            }
            unionColumns.push({
                key,
                displayName: key,
                dataType: info.dataType,
                orderIndex: nextOrder++,
                isNew: true,
            });
        }
        // when there is no existing, ensure stable ordering by insertion of union
        if (input.datasetId === null) {
            unionColumns.sort((a, b) => a.orderIndex - b.orderIndex);
        }

        // step 7: detect conflicts and duplicates against existing dataset
        let duplicateCount = 0;
        const conflicts: MergeConflict[] = [];

        if (input.datasetId !== null) {
            const newTupleToRow = new Map<
                string,
                { row: Record<string, unknown>; fileName: string }
            >();
            for (const p of parsed) {
                for (const [tuple, row] of p.rowsByTuple) {
                    newTupleToRow.set(tuple, { row, fileName: p.file.originalName });
                }
            }

            const commonColumns = unionColumns.filter(
                c => !c.isNew && !input.mergeKeys.includes(c.key)
            );

            const { aborted } = await this.datasetRepo.streamAllRows(
                input.datasetId,
                this.config.maxExistingRowsForMerge,
                ({ data }) => {
                    const tuple = buildTupleKey(data, input.mergeKeys);
                    const match = newTupleToRow.get(tuple);
                    if (!match) {
                        return;
                    }

                    duplicateCount += 1;

                    if (conflicts.length >= MAX_REPORTED_CONFLICTS) {
                        return;
                    }

                    for (const col of commonColumns) {
                        if (!(col.key in match.row)) {
                            continue;
                        }

                        if (!sameValue(data[col.key], match.row[col.key], col.dataType)) {
                            const rowKey: Record<string, unknown> = {};
                            for (const mk of input.mergeKeys) {
                                rowKey[mk] = data[mk];
                            }
                            conflicts.push({
                                rowKey,
                                column: col.key,
                                oldValue: data[col.key],
                                newValue: match.row[col.key],
                            });

                            break;
                        }
                    }
                }
            );

            if (aborted) {
                throw new ValidationError(
                    [],
                    `existing dataset is too large for merge (>${this.config.maxExistingRowsForMerge} rows)`
                );
            }

            if (sharedNonMerge.length === 0 && duplicateCount === 0) {
                throw new ValidationError(
                    [],
                    'new files have no shared rows or columns with the existing dataset besides merge keys'
                );
            }
        }

        if (conflicts.length > 0) {
            // we still save the session so that callers can inspect/cancel via the returned sessionId,
            // but commit will refuse to run. throwing now makes the contract simpler
            throw new ConflictError(
                `merge conflicts detected (${conflicts.length} reported)`
            );
        }

        // step 8: save session
        const session: MergeSession = {
            sessionId: input.sessionId,
            orgId: input.orgId,
            userId: input.userId,
            mode,
            createNew,
            sourceDatasetId: input.datasetId,
            datasetId: input.datasetId,
            name:
                createNew && input.name === null && input.datasetId !== null
                    ? `${sourceDatasetName ?? 'merged dataset'} copy`
                    : input.name,
            mergeKeys: input.mergeKeys,
            files: parsed.map(p => p.file),
            unionColumns,
            createdAt: new Date().toISOString(),
        };

        await this.mergeSessionRepo.save(session, this.config.sessionTtlMs);

        const newColumns = unionColumns
            .filter(c => c.isNew)
            .map(c => ({ key: c.key, dataType: c.dataType }));
        const commonColumnKeys = unionColumns
            .filter(c => !c.isNew && !input.mergeKeys.includes(c.key))
            .map(c => c.key);

        const statistics: MergePreviewStatistics = {
            totalFiles: parsed.length,
            totalIncomingRows: totalParsedRows,
            totalNewRows: totalParsedRows - duplicateCount,
            totalDuplicateRows: duplicateCount,
            existingRowCount,
            copiedRows: createNew ? existingRowCount : 0,
            newColumns,
            commonColumns: commonColumnKeys,
        };

        return {
            sessionId: input.sessionId,
            expiresInMs: this.config.sessionTtlMs,
            statistics,
            conflicts: [],
        };
    }
}

export type PreviewMergeCommandIO = ExecutableIO<PreviewMergeCommand>;

function inferMime(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.csv')) {
        return 'text/csv';
    }
    if (lower.endsWith('.xlsx')) {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return '';
}

function validateAppendColumns(
    parsed: ParsedMergeFile[],
    existingByKey: Map<
        string,
        { dataType: ColumnDataType; displayName: string; orderIndex: number }
    >
): void {
    const expected = new Set(existingByKey.keys());

    for (const p of parsed) {
        const actual = new Set(p.file.columnKeys);
        const missing = [...expected].filter(key => !actual.has(key));
        const extra = [...actual].filter(key => !expected.has(key));

        if (missing.length > 0 || extra.length > 0) {
            throw new ValidationError(
                [...missing, ...extra],
                `append file "${p.file.originalName}" must contain exactly the same columns`
            );
        }
    }
}

function validateInitialAppendColumns(parsed: ParsedMergeFile[]): MergeSessionColumn[] {
    const first = parsed[0];
    if (!first) {
        throw new ValidationError([], 'no files were uploaded');
    }

    const expectedTypes = new Map(
        first.inferredColumns.map(col => [col.key, col.dataType])
    );
    const expectedKeys = new Set(expectedTypes.keys());

    for (const p of parsed) {
        const actualTypes = new Map(
            p.inferredColumns.map(col => [col.key, col.dataType])
        );
        const actualKeys = new Set(actualTypes.keys());
        const missing = [...expectedKeys].filter(key => !actualKeys.has(key));
        const extra = [...actualKeys].filter(key => !expectedKeys.has(key));

        if (missing.length > 0 || extra.length > 0) {
            throw new ValidationError(
                [...missing, ...extra],
                `append file "${p.file.originalName}" must contain exactly the same columns`
            );
        }

        for (const [key, expectedType] of expectedTypes) {
            const actualType = actualTypes.get(key);
            if (actualType !== expectedType) {
                throw new ValidationError(
                    [key],
                    `append file "${p.file.originalName}" column "${key}" must have type "${expectedType}"`
                );
            }
        }
    }

    return first.inferredColumns.map((col, index) => ({
        key: col.key,
        displayName: col.key,
        dataType: col.dataType,
        orderIndex: index,
        isNew: true,
    }));
}

function getDatasetName(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '');
}

function sameValue(oldVal: unknown, newVal: unknown, dataType: ColumnDataType): boolean {
    const a = oldVal === undefined ? null : oldVal;
    let b: unknown;
    try {
        b = coerceValueByType(newVal, dataType, '__cmp__');
    } catch {
        return false;
    }

    if (a === null && b === null) {
        return true;
    }
    if (a === null || b === null) {
        return false;
    }

    return a === b || String(a) === String(b);
}
