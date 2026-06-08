import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import { NotFoundError } from '@qualification-work/microservice-utils/errors';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getOwnerOrgIds } from '@/shared/checkOrgMembership';

export class DeleteDashboardCommand implements Executable<
    [string, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(id: string, orgs: OrgMembership[]): Promise<void> {
        const deleted = await this.dashboardRepo.delete(id, getOwnerOrgIds(orgs));

        if (!deleted) {
            throw new NotFoundError(`Dashboard ${id} not found`);
        }
    }
}

export type DeleteDashboardCommandIO = ExecutableIO<DeleteDashboardCommand>;
