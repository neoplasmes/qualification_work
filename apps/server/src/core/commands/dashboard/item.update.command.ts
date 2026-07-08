import { pick } from 'es-toolkit';

import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import { NotFoundError } from '@qualification-work/microservice-utils/errors';

import type { DashboardMetricSpec, DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getWritableOrgIds } from '@/shared/checkOrgMembership';

export type UpdateDashboardItemInput = { kind: 'metric' } & DashboardMetricSpec;

export class UpdateDashboardItemCommand implements Executable<
    [string, string, UpdateDashboardItemInput, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        dashboardId: string,
        itemId: string,
        input: UpdateDashboardItemInput,
        orgs: OrgMembership[]
    ): Promise<void> {
        const writableOrgIds = getWritableOrgIds(orgs);
        const updated = await this.dashboardRepo.updateMetricItem(
            dashboardId,
            itemId,
            pick(input, [
                'datasetId',
                'name',
                'expression',
                'format',
                'valueMultiplier',
                'target',
                'targetDirection',
                'showTrend',
                'timeColumn',
                'timeBucket',
            ]),
            writableOrgIds
        );

        if (!updated) {
            throw new NotFoundError(
                `Item ${itemId} not found on dashboard ${dashboardId}`
            );
        }
    }
}

export type UpdateDashboardItemCommandIO = ExecutableIO<UpdateDashboardItemCommand>;
