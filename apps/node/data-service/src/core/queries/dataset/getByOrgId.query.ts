import type { DatasetMetadata, DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class GetDatasetsMetadataByOrgIdQuery implements Executable<
    [string],
    Promise<DatasetMetadata[]>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(orgId: string) {
        return this.datasetRepo.getDatasetsMetadataByOrgId(orgId);
    }
}

export type GetDatasetsMetadataByOrgIdQueryIO =
    ExecutableIO<GetDatasetsMetadataByOrgIdQuery>;
