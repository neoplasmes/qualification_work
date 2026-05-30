import { NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import type { DatasetRepo, DatasetRowsPage } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetDatasetRowsQuery implements Executable<
    [string, number, number, OrgMembership[]],
    Promise<DatasetRowsPage>
> {
    constructor(private readonly datasetRepository: DatasetRepo) {}

    async execute(id: string, offset: number, limit: number, orgs: OrgMembership[]) {
        const metadata = await this.datasetRepository.getDatasetMetadataByDatasetId(id);
        if (!metadata) {
            throw new NotFoundError('Dataset not found');
        }

        checkOrgMembership(orgs, metadata.dataset.orgId);

        const rowsPage = await this.datasetRepository.getDatasetRowsPageById({
            datasetId: id,
            offset: offset,
            limit: limit,
        });

        if (!rowsPage) {
            throw new NotFoundError('Dataset not found');
        }

        return rowsPage;
    }
}

export type GetDatasetRowsQueryIO = ExecutableIO<GetDatasetRowsQuery>;
