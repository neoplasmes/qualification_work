import type { ChartRepo, UpdateChartInput } from '@/app/ports/repos/chart';

import type { Command } from '../command';

export function createUpdateChart(repo: ChartRepo): Command<UpdateChartInput, void> {
    return {
        execute: input => repo.updateChart(input),
        writes: input => [
            'chart',
            `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.chartId)}`,
            'dashboard',
            'chartData',
        ],
    };
}
