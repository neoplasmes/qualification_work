import type { ChartRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class DeleteChartCommand implements Executable<[string], Promise<void>> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(chartId: string): Promise<void> {
        await this.chartRepo.delete(chartId);
    }
}

export type DeleteChartCommandIO = ExecutableIO<DeleteChartCommand>;
