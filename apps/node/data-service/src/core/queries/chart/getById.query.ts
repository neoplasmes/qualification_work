import type { Chart } from '@/core/domain';
import { NotFoundError } from '@/core/errors';
import type { ChartRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class GetChartByIdQuery implements Executable<[string], Promise<Chart>> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(chartId: string): Promise<Chart> {
        const chart = await this.chartRepo.getById(chartId);

        if (!chart) {
            throw new NotFoundError('Chart not found');
        }

        return chart;
    }
}

export type GetChartByIdQueryIO = ExecutableIO<GetChartByIdQuery>;
