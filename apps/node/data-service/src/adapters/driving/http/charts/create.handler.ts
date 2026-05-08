import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { CreateChartCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

// Deep ChartConfig validation is deferred - the compiler will throw on unknown columnId/aggregate.
// Config is stored as JSONB; validation can be tightened once the shape stabilizes.
const createChartSchema = z.object({
    orgId: z.uuid(),
    datasetId: z.uuid(),
    name: z.string().min(1).max(255),
    chartType: z.enum(['bar', 'line', 'pie', 'heatmap']),
    config: z.looseObject({}),
});

export function createCreateChartHandler(
    handler: CreateChartCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const rawBody = await request.json<unknown>();
        const input = parseWithZod(createChartSchema, rawBody);

        // chartType and config.kind must match; the compiler dispatches on config.kind
        const result = await handler.execute({
            orgId: input.orgId,
            datasetId: input.datasetId,
            name: input.name,
            chartType: input.chartType,
            // cast until full zod schema is in place
            config: input.config as never,
        });

        response.status(201).json(result);
    };
}
