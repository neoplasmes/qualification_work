import type { OrgMembership } from '@qualification-work/microservice-utils/auth';

import type { DatasetMetadata, DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetDatasetsMetadataByOrgIdQuery implements Executable<
    [string, OrgMembership[]],
    Promise<DatasetMetadata[]>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(orgId: string, orgs: OrgMembership[]) {
        checkOrgMembership(orgs, orgId);

        return this.datasetRepo.getDatasetsMetadataByOrgId(orgId);
    }
}

export type GetDatasetsMetadataByOrgIdQueryIO =
    ExecutableIO<GetDatasetsMetadataByOrgIdQuery>;
