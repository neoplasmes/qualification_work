import type { ChartRepo, UpdateChartPayload } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class UpdateChartCommand implements Executable<
    [string, UpdateChartPayload],
    Promise<void>
> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(chartId: string, payload: UpdateChartPayload): Promise<void> {
        await this.chartRepo.update(chartId, payload);
    }
}

export type UpdateChartCommandIO = ExecutableIO<UpdateChartCommand>;
