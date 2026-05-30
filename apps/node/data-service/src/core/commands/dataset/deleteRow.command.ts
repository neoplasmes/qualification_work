import { ForbiddenError, NotFoundError } from '@qualification-work/microservice-utils';
import type { DatasetRow } from '@qualification-work/types';

import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export type DeleteRowInput = {
    orgId: string;
    datasetId: string;
    rowId: string;
};

export class DeleteRowCommand implements Executable<
    [DeleteRowInput],
    Promise<DatasetRow>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(input: DeleteRowInput): Promise<DatasetRow> {
        const metadata = await this.datasetRepo.getDatasetMetadataByDatasetId(
            input.datasetId
        );

        if (!metadata) {
            throw new NotFoundError('dataset not found');
        }

        if (metadata.dataset.orgId !== input.orgId) {
            throw new ForbiddenError('dataset belongs to another organization');
        }

        const deleted = await this.datasetRepo.deleteRow(input.datasetId, input.rowId);

        if (!deleted) {
            throw new NotFoundError('row not found');
        }

        return deleted;
    }
}

export type DeleteRowCommandIO = ExecutableIO<DeleteRowCommand>;
