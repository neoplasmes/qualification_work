import { NotFoundError, ValidationError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export type PatchDatasetPayload = {
    name?: string;
};

export class PatchDatasetCommand implements Executable<
    [string, PatchDatasetPayload, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(
        datasetId: string,
        payload: PatchDatasetPayload,
        orgs: OrgMembership[]
    ): Promise<void> {
        if (Object.keys(payload).length === 0) {
            throw new ValidationError([], 'patch body is empty');
        }

        const metadata = await this.datasetRepo.getDatasetMetadataByDatasetId(datasetId);

        if (!metadata) {
            throw new NotFoundError('Dataset not found');
        }

        checkWritableOrgMembership(orgs, metadata.dataset.orgId);

        if (payload.name !== undefined) {
            await this.datasetRepo.updateName(datasetId, payload.name);
        }
    }
}

export type PatchDatasetCommandIO = ExecutableIO<PatchDatasetCommand>;
