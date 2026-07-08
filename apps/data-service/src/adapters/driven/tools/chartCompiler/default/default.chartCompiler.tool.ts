import type { Pool } from 'pg';

import type { ChartResponse } from '@qualification-work/types';

import type { ChartCompilationContext } from '@/core/ports/driven/repos';
import type { ChartCompilerTool, CompileOverrides } from '@/core/ports/driven/tools';

import { executeBarOrLineChart } from './executeBarOrLineChart';
import { executeHeatmapChart } from './executeHeatmapChart';
import { executePieChart } from './executePieChart';
import { mergeFilters } from './lib';

const DEFAULT_LIMIT = 1000;

/**
 * Default compiler: ChartConfig + dataset_rows JSONB -> single GROUP BY SQL query.
 *
 * @export
 * @class DefaultChartCompilerTool
 * @implements {ChartCompilerTool}
 */
export class DefaultChartCompilerTool implements ChartCompilerTool {
    constructor(private readonly pool: Pool) {}

    async compileAndExecute(
        ctx: ChartCompilationContext,
        overrides?: CompileOverrides
    ): Promise<ChartResponse> {
        const config = ctx.chart.config;
        const columnsById = new Map(ctx.columns.map(c => [c.id, c]));

        const filters = mergeFilters(config.filters, overrides?.filterOverrides);
        const limit = config.limit ?? DEFAULT_LIMIT;

        switch (config.kind) {
            case 'bar':
            case 'line':
                return executeBarOrLineChart(
                    this.pool,
                    ctx,
                    config,
                    columnsById,
                    filters,
                    limit
                );
            case 'pie':
                return executePieChart(
                    this.pool,
                    ctx,
                    config,
                    columnsById,
                    filters,
                    limit
                );
            case 'heatmap':
                return executeHeatmapChart(
                    this.pool,
                    ctx,
                    config,
                    columnsById,
                    filters,
                    limit
                );
        }
    }
}
