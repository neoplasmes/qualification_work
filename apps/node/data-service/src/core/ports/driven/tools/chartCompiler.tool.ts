import type { ChartResponse } from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';

/**
 * extra filters for specific needs
 */
export type CompileOverrides = {
    filterOverrides?: ChartCompilationContext['chart']['config']['filters'];
};

/**
 * just a query builder
 */
export interface ChartCompilerTool {
    compileAndExecute(
        ctx: ChartCompilationContext,
        overrides?: CompileOverrides
    ): Promise<ChartResponse>;
}
