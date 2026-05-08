import type { ChartResultDTO } from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';

// Extra filters supplied per-request, merged with config.filters before execution.
// Needed for dashboard variables (see dashboards.dashboard_variables).
export type CompileOverrides = {
    filterOverrides?: ChartCompilationContext['chart']['config']['filters'];
};

// Contract: ChartConfig + dataset rows -> SQL -> ChartResultDTO.
export interface ChartCompilerTool {
    compileAndExecute(
        ctx: ChartCompilationContext,
        overrides?: CompileOverrides
    ): Promise<ChartResultDTO>;
}
