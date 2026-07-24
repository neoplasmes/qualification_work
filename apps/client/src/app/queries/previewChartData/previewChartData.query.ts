import type { ChartData } from '@/core/entities/chart';

import type { ChartRepo, PreviewChartDataInput } from '@/app/ports/repos/chart';

import type { Query } from '../query';

export function createPreviewChartData(
    repo: ChartRepo
): Query<PreviewChartDataInput, ChartData> {
    return {
        name: 'previewChartData',
        execute: (input, options) => repo.previewChartData(input, options),
        reads: () => ['chartData'],
    };
}
