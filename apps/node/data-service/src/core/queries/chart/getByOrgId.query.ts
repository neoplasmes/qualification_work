import type { Chart } from '@/core/domain';
import type { ChartRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class GetChartsByOrgIdQuery implements Executable<[string], Promise<Chart[]>> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(orgId: string): Promise<Chart[]> {
        return this.chartRepo.getByOrgId(orgId);
    }
}

export type GetChartsByOrgIdQueryIO = ExecutableIO<GetChartsByOrgIdQuery>;
