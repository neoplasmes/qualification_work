import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import {
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils/errors';
import {
    dashboardGridColumns,
    type DashboardItemLayoutInput,
} from '@qualification-work/types';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getWritableOrgIds } from '@/shared/checkOrgMembership';

const entriesOverlap = (
    a: DashboardItemLayoutInput,
    b: DashboardItemLayoutInput
): boolean =>
    a.posX < b.posX + b.width &&
    a.posX + a.width > b.posX &&
    a.posY < b.posY + b.height &&
    a.posY + a.height > b.posY;

export class UpdateDashboardLayoutCommand implements Executable<
    [string, DashboardItemLayoutInput[], OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        dashboardId: string,
        layout: DashboardItemLayoutInput[],
        orgs: OrgMembership[]
    ): Promise<void> {
        const ids = new Set<string>();

        for (const entry of layout) {
            if (ids.has(entry.itemId)) {
                throw new ValidationError(
                    ['layout'],
                    `Duplicate itemId ${entry.itemId} in layout request`
                );
            }
            if (entry.posX < 0 || entry.posY < 0 || entry.width < 1 || entry.height < 1) {
                throw new ValidationError(
                    ['layout'],
                    `Item ${entry.itemId} has invalid grid geometry`
                );
            }
            if (entry.posX + entry.width > dashboardGridColumns) {
                throw new ValidationError(
                    ['layout'],
                    `Item ${entry.itemId} does not fit the ${dashboardGridColumns}-column grid`
                );
            }

            ids.add(entry.itemId);
        }

        for (let i = 0; i < layout.length; i += 1) {
            for (let j = i + 1; j < layout.length; j += 1) {
                if (entriesOverlap(layout[i], layout[j])) {
                    throw new ValidationError(
                        ['layout'],
                        `Items ${layout[i].itemId} and ${layout[j].itemId} overlap`
                    );
                }
            }
        }

        const {
            dashboardFound,
            itemCount,
            matchedCount,
            invalidSizeCount,
            updatedCount,
        } = await this.dashboardRepo.updateItemsLayout(
            dashboardId,
            layout,
            getWritableOrgIds(orgs)
        );

        if (!dashboardFound) {
            throw new NotFoundError(`Dashboard ${dashboardId} not found`);
        }

        if (matchedCount < layout.length) {
            throw new ValidationError(
                ['layout'],
                `Some items do not belong to dashboard ${dashboardId}`
            );
        }

        if (itemCount !== layout.length) {
            throw new ValidationError(
                ['layout'],
                `Layout must include every item on dashboard ${dashboardId}`
            );
        }

        if (invalidSizeCount > 0) {
            throw new ValidationError(
                ['layout'],
                'Some dashboard items are smaller than their minimum grid size'
            );
        }

        if (updatedCount < layout.length) {
            throw new ValidationError(['layout'], 'Dashboard layout was not updated');
        }
    }
}

export type UpdateDashboardLayoutCommandIO = ExecutableIO<UpdateDashboardLayoutCommand>;
