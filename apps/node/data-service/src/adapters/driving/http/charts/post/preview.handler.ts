import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';
import { chartTypes } from '@qualification-work/types';

import type { PreviewChartDataQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const previewSchema = z.object({
    datasetId: z.uuid(),
    chartType: z.enum(chartTypes),
    config: z.looseObject({}),
    filterOverrides: z.array(z.looseObject({})).optional(),
});

export function createPreviewChartDataHandler(
    handler: PreviewChartDataQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const rawBody = await request.json<unknown>();
        const input = parseWithZod(previewSchema, rawBody);
        const identity = getInternalIdentity(request);

        const result = await handler.execute({
            datasetId: input.datasetId,
            chartType: input.chartType,
            config: input.config as never,
            filterOverrides: input.filterOverrides as never,
            orgs: identity.orgs,
        });

        response.status(200).json(result);
    };
}
