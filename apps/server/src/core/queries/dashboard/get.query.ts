import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import { NotFoundError } from '@qualification-work/microservice-utils/errors';
import type { Dashboard } from '@qualification-work/types';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getReadableOrgIds } from '@/shared/checkOrgMembership';

export class GetDashboardQuery implements Executable<
    [string, OrgMembership[]],
    Promise<Dashboard>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(id: string, orgs: OrgMembership[]): Promise<Dashboard> {
        const dashboard = await this.dashboardRepo.findById(id, getReadableOrgIds(orgs));

        if (!dashboard) {
            throw new NotFoundError(`Dashboard ${id} not found`);
        }

        return dashboard;
    }
}

export type GetDashboardQueryIO = ExecutableIO<GetDashboardQuery>;
