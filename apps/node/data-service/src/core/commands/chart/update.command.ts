import { assertChartConfigUsesAnalyzableColumns } from '@/core/domain/chart';
import { NotFoundError } from '@/core/errors';
import type { ChartRepo, UpdateChartPayload } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class UpdateChartCommand implements Executable<
    [string, UpdateChartPayload],
    Promise<void>
> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(chartId: string, payload: UpdateChartPayload): Promise<void> {
        if (payload.config) {
            const chart = await this.chartRepo.getById(chartId);
            if (!chart) {
                throw new NotFoundError('Chart not found');
            }

            const datasetCtx = await this.chartRepo.getDatasetContext(chart.datasetId);
            if (!datasetCtx) {
                throw new NotFoundError('Dataset not found');
            }

            assertChartConfigUsesAnalyzableColumns(payload.config, datasetCtx.columns);
        }

        await this.chartRepo.update(chartId, payload);
    }
}

export type UpdateChartCommandIO = ExecutableIO<UpdateChartCommand>;
