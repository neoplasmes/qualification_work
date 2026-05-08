import type { ChartConfig, ChartType } from '@qualification-work/types';

import type { ChartRepo, CreateChartPayload } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class CreateChartCommand implements Executable<
    [CreateChartPayload],
    Promise<{ id: string }>
> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(payload: CreateChartPayload) {
        return this.chartRepo.create(payload);
    }
}

export type CreateChartCommandIO = ExecutableIO<CreateChartCommand>;

// re-export so handlers and routers do not reach into ports directly
export type { CreateChartPayload };
export type { ChartConfig, ChartType };
