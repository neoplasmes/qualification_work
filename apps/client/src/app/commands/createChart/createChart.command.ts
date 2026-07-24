import type {
    ChartRepo,
    CreateChartInput,
    CreateChartResult,
} from '@/app/ports/repos/chart';

import type { Command } from '../command';

export function createCreateChart(
    repo: ChartRepo
): Command<CreateChartInput, CreateChartResult> {
    return {
        execute: input => repo.createChart(input),
        writes: (input, output) => [
            'chart',
            `chart:${encodeURIComponent(input.orgId)}/${encodeURIComponent(output.id)}`,
        ],
    };
}
