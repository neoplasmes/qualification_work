import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import type { ChartDB as Chart } from '@qualification-work/types';

import type { ChartRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetChartsByOrgIdQuery implements Executable<
    [string, OrgMembership[]],
    Promise<Chart[]>
> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(orgId: string, orgs: OrgMembership[]): Promise<Chart[]> {
        checkOrgMembership(orgs, orgId);

        return this.chartRepo.getByOrgId(orgId);
    }
}

export type GetChartsByOrgIdQueryIO = ExecutableIO<GetChartsByOrgIdQuery>;
