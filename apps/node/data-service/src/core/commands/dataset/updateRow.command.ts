import type { DatasetColumn, DatasetRow } from '@/core/domain';
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors';
import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { coerceValueByType } from './helpers';

export type UpdateRowValuesInput = {
    orgId: string;
    datasetId: string;
    rowId: string;
    values: Record<string, unknown>;
};

export class UpdateRowValuesCommand
    implements Executable<[UpdateRowValuesInput], Promise<DatasetRow>>
{
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(input: UpdateRowValuesInput): Promise<DatasetRow> {
        const keys = Object.keys(input.values);

        if (keys.length === 0) {
            throw new ValidationError([], 'values is empty');
        }

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

        const coerced: Record<string, unknown> = {};

        for (const key of keys) {
            const column = columnByKey.get(key);
            if (!column) {
                throw new ValidationError([key], `unknown column "${key}"`);
            }

            coerced[key] = coerceValueByType(input.values[key], column.dataType, key);
        }

        const updated = await this.datasetRepo.updateRowValues(
            input.datasetId,
            input.rowId,
            coerced
        );

        if (!updated) {
            throw new NotFoundError('row not found');
        }

        return updated;
    }
}

export type UpdateRowValuesCommandIO = ExecutableIO<UpdateRowValuesCommand>;
