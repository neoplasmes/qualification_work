import {
    ForbiddenError,
    NotFoundError,
} from '@qualification-work/microservice-utils/errors';
import type { ChartConfig, ChartType } from '@qualification-work/types';

import { assertChartConfigUsesAnalyzableColumns } from '@/core/domain/chart';
import type { ChartRepo, CreateChartPayload } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class CreateChartCommand implements Executable<
    [CreateChartPayload],
    Promise<{ id: string }>
> {
    constructor(private readonly chartRepo: ChartRepo) {}

    async execute(payload: CreateChartPayload) {
        const datasetCtx = await this.chartRepo.getDatasetContext(payload.datasetId);
        if (!datasetCtx) {
            throw new NotFoundError('Dataset not found');
        }

        if (datasetCtx.orgId !== payload.orgId) {
            throw new ForbiddenError('Dataset belongs to another organization');
        }

        assertChartConfigUsesAnalyzableColumns(payload.config, datasetCtx.columns);

        return this.chartRepo.create(payload);
    }
}

export type CreateChartCommandIO = ExecutableIO<CreateChartCommand>;

// re-export so handlers and routers do not reach into ports directly
export type { CreateChartPayload };
export type { ChartConfig, ChartType };
