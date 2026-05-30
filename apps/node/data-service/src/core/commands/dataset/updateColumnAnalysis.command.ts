import type { DatasetColumn } from '@/core/domain';
import { ForbiddenError, NotFoundError } from '@/core/errors';
import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export type UpdateColumnAnalysisInput = {
    orgId: string;
    datasetId: string;
    columnId: string;
    isAnalyzable: boolean;
};

export class UpdateColumnAnalysisCommand implements Executable<
    [UpdateColumnAnalysisInput],
    Promise<DatasetColumn>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(input: UpdateColumnAnalysisInput): Promise<DatasetColumn> {
        const metadata = await this.datasetRepo.getDatasetMetadataByDatasetId(
            input.datasetId
        );

        if (!metadata) {
            throw new NotFoundError('dataset not found');
        }

        if (metadata.dataset.orgId !== input.orgId) {
            throw new ForbiddenError('dataset belongs to another organization');
        }

        const updated = await this.datasetRepo.updateColumnAnalysis(
            input.datasetId,
            input.columnId,
            input.isAnalyzable
        );

        if (!updated) {
            throw new NotFoundError('column not found');
        }

        return updated;
    }
}

export type UpdateColumnAnalysisCommandIO = ExecutableIO<UpdateColumnAnalysisCommand>;
