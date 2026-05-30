import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils';
import type { DatasetColumn, DatasetRow } from '@qualification-work/types';

import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { coerceValueByType } from './lib';

export type InsertRowInput = {
    orgId: string;
    datasetId: string;
    afterRowId?: string;
    data: Record<string, unknown>;
};

export class InsertRowCommand implements Executable<
    [InsertRowInput],
    Promise<DatasetRow>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(input: InsertRowInput): Promise<DatasetRow> {
        const metadata = await this.datasetRepo.getDatasetMetadataByDatasetId(
            input.datasetId
        );

        if (!metadata) {
            throw new NotFoundError('dataset not found');
        }

        if (metadata.dataset.orgId !== input.orgId) {
            throw new ForbiddenError('dataset belongs to another organization');
        }

        const columnByKey = new Map<string, DatasetColumn>();
        for (const column of metadata.columns) {
            columnByKey.set(column.key, column);
        }

        // unknown keys are rejected to keep dataset consistent
        const coerced: Record<string, unknown> = {};

        for (const key of Object.keys(input.data)) {
            const column = columnByKey.get(key);
            if (!column) {
                throw new ValidationError([key], `unknown column "${key}"`);
            }

            const v = coerceValueByType(input.data[key], column.dataType, key);
            if (v !== null) {
                coerced[key] = v;
            }
        }

        const inserted = await this.datasetRepo.insertRow(
            input.datasetId,
            coerced,
            input.afterRowId
        );

        if (!inserted) {
            throw new NotFoundError('row not found');
        }

        return inserted;
    }
}

export type InsertRowCommandIO = ExecutableIO<InsertRowCommand>;
