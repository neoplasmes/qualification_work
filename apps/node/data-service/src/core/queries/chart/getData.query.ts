import type { ChartResultDTO, FilterClause } from '@qualification-work/types';

import { NotFoundError } from '@/core/errors';
import type { ChartRepo } from '@/core/ports/driven/repos';
import type { ChartCompilerTool, CompileOverrides } from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export type GetChartDataInput = {
    chartId: string;
    filterOverrides?: FilterClause[];
};

export class GetChartDataQuery implements Executable<
    [GetChartDataInput],
    Promise<ChartResultDTO>
> {
    constructor(
        private readonly chartRepo: ChartRepo,
        private readonly compiler: ChartCompilerTool
    ) {}

    async execute(input: GetChartDataInput): Promise<ChartResultDTO> {
        const ctx = await this.chartRepo.getCompilationContext(input.chartId);

        if (!ctx) {
            throw new NotFoundError('Chart not found');
        }

        const overrides: CompileOverrides = {
            filterOverrides: input.filterOverrides,
        };

        return this.compiler.compileAndExecute(ctx, overrides);
    }
}

export type GetChartDataQueryIO = ExecutableIO<GetChartDataQuery>;
