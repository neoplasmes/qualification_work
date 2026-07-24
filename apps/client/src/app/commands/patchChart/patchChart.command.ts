import type { ChartRepo, PatchChartInput } from '@/app/ports/repos/chart';

import type { Command } from '../command';

export function createPatchChart(repo: ChartRepo): Command<PatchChartInput, void> {
    return {
        execute: input => repo.patchChart(input),
        writes: input => [
            'chart',
            `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.chartId)}`,
            'dashboard',
            ...(input.config || input.chartType ? ['chartData' as const] : []),
        ],
    };
}
