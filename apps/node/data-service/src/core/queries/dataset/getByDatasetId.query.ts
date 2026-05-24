import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import { NotFoundError } from '@/core/errors';
import type { DatasetMetadata, DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';
import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetDatasetMetadataByDatasetIdQuery implements Executable<
    [string, OrgMembership[]],
    Promise<DatasetMetadata>
> {
    constructor(private readonly datasetRepository: DatasetRepo) {}

    async execute(datasetId: string, orgs: OrgMembership[]) {
        const dataset =
            await this.datasetRepository.getDatasetMetadataByDatasetId(datasetId);

        if (!dataset) {
            throw new NotFoundError('Dataset not found');
        }

        checkOrgMembership(orgs, dataset.dataset.orgId);

        return dataset;
    }
}

export type GetDatasetMetadataByDatasetIdQueryIO =
    ExecutableIO<GetDatasetMetadataByDatasetIdQuery>;
