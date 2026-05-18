import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import { NotFoundError, ValidationError } from '@/core/errors';
import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getWritableOrgIds } from '@/shared/checkOrgMembership';

export class ReorderDashboardCommand implements Executable<
    [string, Array<{ itemId: string; posY: number }>, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        dashboardId: string,
        order: Array<{ itemId: string; posY: number }>,
        orgs: OrgMembership[]
    ): Promise<void> {
        const ids = new Set<string>();
        const positions = new Set<number>();

        for (const entry of order) {
            if (ids.has(entry.itemId)) {
                throw new ValidationError(
                    ['order'],
                    `Duplicate itemId ${entry.itemId} in reorder request`
                );
            }
            if (positions.has(entry.posY)) {
                throw new ValidationError(
                    ['order'],
                    `Duplicate posY ${entry.posY} in reorder request`
                );
            }

            ids.add(entry.itemId);
            positions.add(entry.posY);
        }

        const { dashboardFound, updatedCount } = await this.dashboardRepo.reorderItems(
            dashboardId,
            order,
            getWritableOrgIds(orgs)
        );

        if (!dashboardFound) {
            throw new NotFoundError(`Dashboard ${dashboardId} not found`);
        }

        if (updatedCount < order.length) {
            throw new ValidationError(
                ['order'],
                `Some items do not belong to dashboard ${dashboardId}`
            );
        }
    }
}

export type ReorderDashboardCommandIO = ExecutableIO<ReorderDashboardCommand>;
