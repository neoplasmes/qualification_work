import type { OrgMembership } from '@qualification-work/microservice-utils/auth';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export class CreateDashboardCommand implements Executable<
    [string, string, OrgMembership[]],
    Promise<string>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(orgId: string, name: string, orgs: OrgMembership[]): Promise<string> {
        checkWritableOrgMembership(orgs, orgId);

        return this.dashboardRepo.create(orgId, name);
    }
}

export type CreateDashboardCommandIO = ExecutableIO<CreateDashboardCommand>;
