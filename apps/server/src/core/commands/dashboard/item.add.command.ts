import { pick } from 'es-toolkit';

import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import { NotFoundError } from '@qualification-work/microservice-utils/errors';

import type { DashboardMetricSpec, DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getWritableOrgIds } from '@/shared/checkOrgMembership';

export type AddDashboardItemInput =
    | { kind: 'chart'; chartId: string; height?: number }
    | ({ kind: 'metric'; height?: number } & DashboardMetricSpec);

export class AddDashboardItemCommand implements Executable<
    [string, AddDashboardItemInput, OrgMembership[]],
    Promise<{ itemId: string; posY: number }>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        dashboardId: string,
        input: AddDashboardItemInput,
        orgs: OrgMembership[]
    ): Promise<{ itemId: string; posY: number }> {
        const writableOrgIds = getWritableOrgIds(orgs);
        let result:
            | Awaited<ReturnType<DashboardRepo['addChartItem']>>
            | Awaited<ReturnType<DashboardRepo['addMetricItem']>>
            | null = null;

        switch (input.kind) {
            case 'chart':
                result = await this.dashboardRepo.addChartItem(
                    dashboardId,
                    input.chartId,
                    input.height,
                    writableOrgIds
                );

                break;
            case 'metric':
                result = await this.dashboardRepo.addMetricItem(
                    dashboardId,
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
                    input.height,
                    writableOrgIds
                );

                break;
            default:
        }

        if (result === null) {
            throw new NotFoundError(`Dashboard ${dashboardId} not found`);
        }

        return result;
    }
}

export type AddDashboardItemCommandIO = ExecutableIO<AddDashboardItemCommand>;
