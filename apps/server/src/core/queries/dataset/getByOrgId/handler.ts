import type { DatasetRepository } from '@/core/ports';

import type {
    GetDatasetsMetadataByOrgIdInput,
    GetDatasetsMetadataByOrgIdOutput,
} from './types';

export class GetDatasetsMetadataByOrgIdHandler {
    constructor(private readonly datasetRepository: DatasetRepository) {}

    async execute(
        input: GetDatasetsMetadataByOrgIdInput
    ): Promise<GetDatasetsMetadataByOrgIdOutput> {
        return this.datasetRepository.getDatasetsMetadataByOrgId(input.orgId);
    }
}
