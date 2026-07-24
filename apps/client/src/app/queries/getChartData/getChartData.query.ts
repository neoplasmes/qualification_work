import type { ChartData } from '@/core/entities/chart';

import type { ChartRepo, GetChartDataInput } from '@/app/ports/repos/chart';

import type { Query } from '../query';

export function createGetChartData(repo: ChartRepo): Query<GetChartDataInput, ChartData> {
    return {
        name: 'getChartData',
        execute: (input, options) => repo.getChartData(input, options),
        reads: () => ['chartData'],
    };
}
