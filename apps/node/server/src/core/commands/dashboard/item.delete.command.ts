import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import { NotFoundError } from '@qualification-work/microservice-utils/errors';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getWritableOrgIds } from '@/shared/checkOrgMembership';

export class DeleteDashboardItemCommand implements Executable<
    [string, string, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        dashboardId: string,
        itemId: string,
        orgs: OrgMembership[]
    ): Promise<void> {
        const removed = await this.dashboardRepo.removeItem(
            dashboardId,
            itemId,
            getWritableOrgIds(orgs)
        );

        if (!removed) {
            throw new NotFoundError(
                `Item ${itemId} not found on dashboard ${dashboardId}`
            );
        }
    }
}

export type DeleteDashboardItemCommandIO = ExecutableIO<DeleteDashboardItemCommand>;
