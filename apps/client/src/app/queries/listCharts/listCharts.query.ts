import type { Chart } from '@/core/entities/chart';

import type { ChartRepo, ListChartsInput } from '@/app/ports/repos/chart';

import type { Query } from '../query';

export function createListCharts(repo: ChartRepo): Query<ListChartsInput, Chart[]> {
    return {
        name: 'listCharts',
        execute: (input, options) => repo.listCharts(input, options),
        reads: () => ['chart'],
    };
}
