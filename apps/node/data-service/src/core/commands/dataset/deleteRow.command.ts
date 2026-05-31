import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils';
import type { DatasetRow } from '@qualification-work/types';

import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export type DeleteRowInput = {
    orgId: string;
    datasetId: string;
    rowIds: string[];
};

export class DeleteRowCommand implements Executable<
    [DeleteRowInput],
    Promise<DatasetRow[]>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(input: DeleteRowInput): Promise<DatasetRow[]> {
        if (input.rowIds.length === 0) {
            throw new ValidationError([], 'rowIds is empty');
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

        const deleted = await this.datasetRepo.deleteRows(input.datasetId, input.rowIds);

        if (deleted.length === 0) {
            throw new NotFoundError('rows not found');
        }

        return deleted;
    }
}

export type DeleteRowCommandIO = ExecutableIO<DeleteRowCommand>;
