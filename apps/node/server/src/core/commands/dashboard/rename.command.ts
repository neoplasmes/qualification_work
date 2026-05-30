import { NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getWritableOrgIds } from '@/shared/checkOrgMembership';

export class RenameDashboardCommand implements Executable<
    [string, string, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(id: string, name: string, orgs: OrgMembership[]): Promise<void> {
        const updated = await this.dashboardRepo.updateName(
            id,
            name,
            getWritableOrgIds(orgs)
        );

        if (!updated) {
            throw new NotFoundError(`Dashboard ${id} not found`);
        }
    }
}

export type RenameDashboardCommandIO = ExecutableIO<RenameDashboardCommand>;
