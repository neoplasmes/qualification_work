import { NotFoundError } from '@/core/errors';
import type { DatasetRepository } from '@/core/ports';

import type { GetDatasetMetadataInput, GetDatasetMetadataOutput } from './types';

export class GetDatasetMetadataHandler {
    constructor(private readonly datasetRepository: DatasetRepository) {}

    async execute(input: GetDatasetMetadataInput): Promise<GetDatasetMetadataOutput> {
        const dataset = await this.datasetRepository.getDatasetMetadataByDatasetId(
            input.id
        );

        if (!dataset) {
            throw new NotFoundError('Dataset not found');
        }

        return dataset;
    }
}
