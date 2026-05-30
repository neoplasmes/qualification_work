import { ForbiddenError, NotFoundError } from '@qualification-work/microservice-utils';
import type { ColumnDataType } from '@qualification-work/types';

import type {
    AppendRowsFn,
    DatasetRepo,
    MergeMode,
    MergeSession,
    MergeSessionRepo,
} from '@/core/ports/driven/repos';
import type {
    DatasetFileSourceType,
    ResolveDatasetParser,
    TmpFileStorageTool,
} from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { coerceValueByType } from '../lib';
import { buildTupleKey } from './lib';

export type CommitMergeInput = {
    sessionId: string;
    orgId: string;
};

export type CommitMergeResult = {
    datasetId: string;
    insertedRows: number;
    updatedRows: number;
    skippedDuplicates: number;
    copiedRows: number;
};

type ExistingRowsByTuple = Map<string, string>;

export class CommitMergeCommand implements Executable<
    [CommitMergeInput],
    Promise<CommitMergeResult>
> {
    constructor(
        private readonly datasetRepo: DatasetRepo,
        private readonly mergeSessionRepo: MergeSessionRepo,
        private readonly tmpStorage: TmpFileStorageTool,
        private readonly resolveParser: ResolveDatasetParser
    ) {}

    async execute(input: CommitMergeInput): Promise<CommitMergeResult> {
        const session = await this.mergeSessionRepo.get(input.sessionId);
        if (!session) {
            throw new NotFoundError('merge session not found or expired');
        }
        if (session.orgId !== input.orgId) {
            throw new ForbiddenError('merge session belongs to another organization');
        }

        const typeByKey = new Map<string, ColumnDataType>();
        for (const c of session.unionColumns) {
            typeByKey.set(c.key, c.dataType);
        }

        const mode = session.mode ?? 'merge';
        const createNew = session.createNew ?? session.datasetId === null;
        const sourceDatasetId = session.sourceDatasetId ?? session.datasetId;

        // resolve target dataset id
        let targetDatasetId: string;
        let copiedRows = 0;
        if (createNew || sourceDatasetId === null) {
            const sourceType = pickSourceType(session.files.map(f => f.sourceType));
            const created = await this.datasetRepo.createEmptyDataset({
                orgId: session.orgId,
                name: session.name ?? 'merged dataset',
                sourceType,
                columns: session.unionColumns.map(c => ({
                    key: c.key,
                    displayName: c.displayName,
                    dataType: c.dataType,
                    orderIndex: c.orderIndex,
                })),
            });
            targetDatasetId = created.id;
            if (sourceDatasetId !== null) {
                const copy = await this.datasetRepo.copyRowsToDataset(
                    sourceDatasetId,
                    targetDatasetId
                );
                copiedRows = copy.copiedCount;
            }
        } else {
            targetDatasetId = sourceDatasetId;

            const newColumns = session.unionColumns.filter(c => c.isNew);
            if (newColumns.length > 0) {
                await this.datasetRepo.addColumns(
                    targetDatasetId,
                    newColumns.map(c => ({
                        key: c.key,
                        displayName: c.displayName,
                        dataType: c.dataType,
                        orderIndex: c.orderIndex,
                    }))
                );
            }
        }

        const existingRowsByTuple = await this.getExistingRowsByTuple(
            targetDatasetId,
            mode,
            sourceDatasetId,
            session.mergeKeys
        );
        const updatedRows = await this.updateMatchingRows(
            targetDatasetId,
            existingRowsByTuple,
            session.mergeKeys,
            session.files,
            typeByKey
        );

        // stream every file from disk again, appending rows that were not matched by key
        let skippedDuplicates = 0;
        const insertion = await this.datasetRepo.bulkAppendRows(
            targetDatasetId,
            async (appendRow: AppendRowsFn) => {
                for (const file of session.files) {
                    const resolved = this.resolveParser(
                        inferMime(file.originalName),
                        file.originalName
                    );
                    if (!resolved) {
                        // should never happen - already validated on preview
                        continue;
                    }

                    const stream = this.tmpStorage.openFile(file.path);
                    const rowStream =
                        resolved.parser.parseFileDataToJSObjectsStream(stream);

                    for await (const raw of rowStream) {
                        const row = raw as Record<string, unknown>;

                        if (
                            mode === 'merge' &&
                            session.mergeKeys.length > 0 &&
                            existingRowsByTuple.size > 0
                        ) {
                            const tuple = buildTupleKey(row, session.mergeKeys);
                            if (existingRowsByTuple.has(tuple)) {
                                skippedDuplicates += 1;

                                continue;
                            }
                        }

                        const coerced: Record<string, unknown> = {};
                        for (const key of Object.keys(row)) {
                            const dataType = typeByKey.get(key);
                            if (!dataType) {
                                // column not in session union - skip
                                continue;
                            }

                            const v = coerceValueByType(row[key], dataType, key);
                            if (v !== null) {
                                coerced[key] = v;
                            }
                        }

                        await appendRow(coerced);
                    }
                }
            }
        );

        // cleanup tmp + session
        await Promise.all([
            this.tmpStorage.deleteSession(session.sessionId),
            this.mergeSessionRepo.delete(session.sessionId),
        ]);

        return {
            datasetId: targetDatasetId,
            insertedRows: insertion.insertedCount,
            updatedRows,
            skippedDuplicates,
            copiedRows,
        };
    }

    private async getExistingRowsByTuple(
        targetDatasetId: string,
        mode: MergeMode,
        sourceDatasetId: string | null,
        mergeKeys: string[]
    ): Promise<ExistingRowsByTuple> {
        const existingRowsByTuple: ExistingRowsByTuple = new Map();
        if (mode !== 'merge' || sourceDatasetId === null || mergeKeys.length === 0) {
            return existingRowsByTuple;
        }

        await this.datasetRepo.streamAllRows(
            targetDatasetId,
            Number.POSITIVE_INFINITY,
            ({ rowId, data }) => {
                existingRowsByTuple.set(buildTupleKey(data, mergeKeys), rowId);
            }
        );

        return existingRowsByTuple;
    }

    private async updateMatchingRows(
        targetDatasetId: string,
        existingRowsByTuple: ExistingRowsByTuple,
        mergeKeys: string[],
        files: MergeSession['files'],
        typeByKey: Map<string, ColumnDataType>
    ): Promise<number> {
        if (existingRowsByTuple.size === 0 || mergeKeys.length === 0) {
            return 0;
        }

        let updatedRows = 0;
        for (const file of files) {
            const resolved = this.resolveParser(
                inferMime(file.originalName),
                file.originalName
            );
            if (!resolved) {
                continue;
            }

            const stream = this.tmpStorage.openFile(file.path);
            const rowStream = resolved.parser.parseFileDataToJSObjectsStream(stream);

            for await (const raw of rowStream) {
                const row = raw as Record<string, unknown>;
                const existingRowId = existingRowsByTuple.get(
                    buildTupleKey(row, mergeKeys)
                );

                if (!existingRowId) {
                    continue;
                }

                const coerced = coerceMergeRow(row, typeByKey, mergeKeys);
                if (Object.keys(coerced).length === 0) {
                    continue;
                }

                const updated = await this.datasetRepo.updateRowValues(
                    targetDatasetId,
                    existingRowId,
                    coerced
                );
                if (updated) {
                    updatedRows += 1;
                }
            }
        }

        return updatedRows;
    }
}

export type CommitMergeCommandIO = ExecutableIO<CommitMergeCommand>;

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

function pickSourceType(types: DatasetFileSourceType[]): 'csv' | 'xlsx' | 'manual' {
    if (types.length === 0) {
        return 'manual';
    }
    const first = types[0];

    return types.every(t => t === first) ? first : 'manual';
}

function coerceMergeRow(
    row: Record<string, unknown>,
    typeByKey: Map<string, ColumnDataType>,
    excludedKeys: string[]
): Record<string, unknown> {
    const excluded = new Set(excludedKeys);
    const coerced: Record<string, unknown> = {};

    for (const key of Object.keys(row)) {
        if (excluded.has(key)) {
            continue;
        }

        const dataType = typeByKey.get(key);
        if (!dataType) {
            continue;
        }

        const v = coerceValueByType(row[key], dataType, key);
        if (v !== null) {
            coerced[key] = v;
        }
    }

    return coerced;
}
