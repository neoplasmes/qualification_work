import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { Dashboard } from '@qualification-work/types';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getReadableOrgIds } from '@/shared/checkOrgMembership';

export class ListDashboardsQuery implements Executable<
    [string, OrgMembership[]],
    Promise<Dashboard[]>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(orgId: string, orgs: OrgMembership[]): Promise<Dashboard[]> {
        return this.dashboardRepo.listByOrg(orgId, getReadableOrgIds(orgs));
    }
}

export type ListDashboardsQueryIO = ExecutableIO<ListDashboardsQuery>;
