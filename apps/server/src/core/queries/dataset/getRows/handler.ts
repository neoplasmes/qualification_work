import { NotFoundError } from '@/core/errors';
import type { DatasetRepository } from '@/core/ports';

import type { GetDatasetRowsInput, GetDatasetRowsOutput } from './types';

export class GetDatasetRowsHandler {
    constructor(private readonly datasetRepository: DatasetRepository) {}

    async execute(input: GetDatasetRowsInput): Promise<GetDatasetRowsOutput> {
        const rowsPage = await this.datasetRepository.getDatasetRowsPageById({
            datasetId: input.id,
            offset: input.offset,
            limit: input.limit,
        });

        if (!rowsPage) {
            throw new NotFoundError('Dataset not found');
        }

        return rowsPage;
    }
}
