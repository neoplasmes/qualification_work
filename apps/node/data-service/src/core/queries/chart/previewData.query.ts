import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { ChartConfig, ChartResponse, ChartType, FilterClause } from '@qualification-work/types';

import type { Chart } from '@/core/domain';
import { NotFoundError } from '@/core/errors';
import type { ChartCompilationContext, ChartRepo } from '@/core/ports/driven/repos';
import type { ChartCompilerTool } from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';
import { checkOrgMembership } from '@/shared/checkOrgMembership';

export type PreviewChartDataInput = {
    datasetId: string;
    chartType: ChartType;
    config: ChartConfig;
    filterOverrides?: FilterClause[];
    orgs: OrgMembership[];
};

export class PreviewChartDataQuery
    implements Executable<[PreviewChartDataInput], Promise<ChartResponse>>
{
    constructor(
        private readonly chartRepo: ChartRepo,
        private readonly compiler: ChartCompilerTool
    ) {}

    async execute(input: PreviewChartDataInput): Promise<ChartResponse> {
        const datasetCtx = await this.chartRepo.getDatasetContext(input.datasetId);

        if (!datasetCtx) {
            throw new NotFoundError('Dataset not found');
        }

        checkOrgMembership(input.orgs, datasetCtx.orgId);

        // synthetic chart - compiler dispatches on config, id/orgId/name are unused
        const syntheticChart: Chart = {
            id: '',
            orgId: '',
            name: '',
            datasetId: input.datasetId,
            chartType: input.chartType,
            config: input.config,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const ctx: ChartCompilationContext = {
            chart: syntheticChart,
            datasetId: input.datasetId,
            dataVersion: datasetCtx.dataVersion,
            columns: datasetCtx.columns,
        };

        return this.compiler.compileAndExecute(ctx, { filterOverrides: input.filterOverrides });
    }
}

export type PreviewChartDataQueryIO = ExecutableIO<PreviewChartDataQuery>;
