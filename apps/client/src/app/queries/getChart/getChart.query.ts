import type { Chart } from '@/core/entities/chart';

import type { ChartRepo, ChartScope } from '@/app/ports/repos/chart';

import type { Query } from '../query';

export function createGetChart(repo: ChartRepo): Query<ChartScope, Chart> {
    return {
        name: 'getChart',
        execute: (input, options) => repo.getChart(input, options),
        reads: input => [
            `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.chartId)}`,
        ],
    };
}
