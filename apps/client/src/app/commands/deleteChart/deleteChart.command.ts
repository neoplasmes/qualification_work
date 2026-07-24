import type { ChartRepo, ChartScope } from '@/app/ports/repos/chart';

import type { Command } from '../command';

export function createDeleteChart(repo: ChartRepo): Command<ChartScope, void> {
    return {
        execute: input => repo.deleteChart(input),
        writes: input => [
            'chart',
            `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.chartId)}`,
            'dashboard',
            'chartData',
        ],
    };
}
