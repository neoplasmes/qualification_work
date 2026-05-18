import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { Dashboard } from '@qualification-work/types';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getReadableOrgIds } from '@/shared/checkOrgMembership';

export class ListDashboardsQuery implements Executable<
    [string, OrgMembership[]],
    Promise<Omit<Dashboard, 'items'>[]>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        orgId: string,
        orgs: OrgMembership[]
    ): Promise<Omit<Dashboard, 'items'>[]> {
        return this.dashboardRepo.listByOrg(orgId, getReadableOrgIds(orgs));
    }
}

export type ListDashboardsQueryIO = ExecutableIO<ListDashboardsQuery>;
