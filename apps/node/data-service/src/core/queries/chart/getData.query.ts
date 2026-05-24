import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { ChartResponse, FilterClause } from '@qualification-work/types';

import { NotFoundError } from '@/core/errors';
import type { ChartRepo } from '@/core/ports/driven/repos';
import type { ChartCompilerTool, CompileOverrides } from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';
import { checkOrgMembership } from '@/shared/checkOrgMembership';

export type GetChartDataInput = {
    chartId: string;
    filterOverrides?: FilterClause[];
    orgs: OrgMembership[];
};

export class GetChartDataQuery implements Executable<
    [GetChartDataInput],
    Promise<ChartResponse>
> {
    constructor(
        private readonly chartRepo: ChartRepo,
        private readonly compiler: ChartCompilerTool
    ) {}

    async execute(input: GetChartDataInput): Promise<ChartResponse> {
        const ctx = await this.chartRepo.getCompilationContext(input.chartId);

        if (!ctx) {
            throw new NotFoundError('Chart not found');
        }

        checkOrgMembership(input.orgs, ctx.chart.orgId);

        const overrides: CompileOverrides = {
            filterOverrides: input.filterOverrides,
        };

        return this.compiler.compileAndExecute(ctx, overrides);
    }
}

export type GetChartDataQueryIO = ExecutableIO<GetChartDataQuery>;
