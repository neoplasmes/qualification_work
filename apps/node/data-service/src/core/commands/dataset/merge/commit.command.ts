import type { ColumnDataType } from '@/core/domain';
import { ForbiddenError, NotFoundError } from '@/core/errors';
import type { AppendRowsFn, DatasetRepo, MergeSessionRepo } from '@/core/ports/driven/repos';
import type {
    DatasetFileSourceType,
    ResolveDatasetParser,
    TmpFileStorageTool,
} from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { coerceValueByType } from '../helpers';

import { buildTupleKey } from './helpers';

export type CommitMergeInput = {
    sessionId: string;
    orgId: string;
};

export type CommitMergeResult = {
    datasetId: string;
    insertedRows: number;
    skippedDuplicates: number;
};

export class CommitMergeCommand
    implements Executable<[CommitMergeInput], Promise<CommitMergeResult>>
{
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

        // collect existing tuples to skip duplicates when merging into existing dataset
        const existingTuples = new Set<string>();
        if (session.datasetId !== null && session.mergeKeys.length > 0) {
            await this.datasetRepo.streamAllRows(
                session.datasetId,
                Number.POSITIVE_INFINITY,
                ({ data }) => {
                    existingTuples.add(buildTupleKey(data, session.mergeKeys));
                }
            );
        }

        // resolve target dataset id
        let targetDatasetId: string;
        if (session.datasetId === null) {
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
        } else {
            targetDatasetId = session.datasetId;

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

        // stream every file from disk again, skipping duplicates and coercing values
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
                    const rowStream = resolved.parser.parseFileDataToJSObjectsStream(
                        stream
                    );

                    for await (const raw of rowStream) {
                        const row = raw as Record<string, unknown>;

                        if (session.mergeKeys.length > 0 && existingTuples.size > 0) {
                            const tuple = buildTupleKey(row, session.mergeKeys);
                            if (existingTuples.has(tuple)) {
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
            skippedDuplicates,
        };
    }
}

export type CommitMergeCommandIO = ExecutableIO<CommitMergeCommand>;

function inferMime(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.csv')) {return 'text/csv';}
    if (lower.endsWith('.xlsx')) {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return '';
}

function pickSourceType(types: DatasetFileSourceType[]): 'csv' | 'xlsx' | 'manual' {
    if (types.length === 0) {return 'manual';}
    const first = types[0];

    return types.every(t => t === first) ? first : 'manual';
}
