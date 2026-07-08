import type { OrgMembership } from '@qualification-work/microservice-utils/auth';
import { NotFoundError } from '@qualification-work/microservice-utils/errors';
import type { ChartDB as Chart } from '@qualification-work/types';

import type { ChartRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetChartByIdQuery implements Executable<
    [string, OrgMembership[]],
    Promise<Chart>
> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(chartId: string, orgs: OrgMembership[]): Promise<Chart> {
        const chart = await this.chartRepo.getById(chartId);

        if (!chart) {
            throw new NotFoundError('Chart not found');
        }

        checkOrgMembership(orgs, chart.orgId);

        return chart;
    }
}

export type GetChartByIdQueryIO = ExecutableIO<GetChartByIdQuery>;
