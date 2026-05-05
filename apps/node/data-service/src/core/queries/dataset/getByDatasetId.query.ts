import { NotFoundError } from '@/core/errors';
import type { DatasetMetadata, DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class GetDatasetMetadataByDatasetIdQuery implements Executable<
    [string],
    Promise<DatasetMetadata>
> {
    constructor(private readonly datasetRepository: DatasetRepo) {}

    async execute(datasetId: string) {
        const dataset =
            await this.datasetRepository.getDatasetMetadataByDatasetId(datasetId);

        if (!dataset) {
            throw new NotFoundError('Dataset not found');
        }

        return dataset;
    }
}

export type GetDatasetMetadataByDatasetIdQueryIO =
    ExecutableIO<GetDatasetMetadataByDatasetIdQuery>;
