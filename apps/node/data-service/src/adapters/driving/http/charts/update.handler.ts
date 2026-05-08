import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { UpdateChartCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const updateChartSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    chartType: z.enum(['bar', 'line', 'pie', 'heatmap']).optional(),
    config: z.looseObject({}).optional(),
});

export function createUpdateChartHandler(
    handler: UpdateChartCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const rawBody = await request.json<unknown>();
        const body = parseWithZod(updateChartSchema, rawBody);

        await handler.execute(id, {
            name: body.name,
            chartType: body.chartType,
            config: body.config as never,
        });

        response.status(204).end();
    };
}
