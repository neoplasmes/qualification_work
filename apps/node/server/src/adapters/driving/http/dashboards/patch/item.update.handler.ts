import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { UpdateDashboardItemCommand } from '@/core/commands';

import { metricConfigSchema } from '@/adapters/driving/http/dashboards/shared';

import type { RequestHandlerType } from '@/shared/appState';

const updateItemSchema = z.object({
    kind: z.literal('metric'),
    datasetId: z.uuid(),
    name: z.string().trim().min(1).max(255),
    expression: z.string().trim().min(1),
    format: z.string().trim().max(24).default(''),
    valueMultiplier: z.number().finite().default(1),
    ...metricConfigSchema,
});

const paramsSchema = z.object({
    id: z.uuid(),
    itemId: z.uuid(),
});

export function createUpdateItemHandler(
    updateItem: UpdateDashboardItemCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const { id: dashboardId, itemId } = parseWithZod(paramsSchema, {
            id: request.params.id,
            itemId: request.params.itemId,
        });

        const body = await request.json();
        const input = parseWithZod(updateItemSchema, body);

        const orgs = getInternalIdentity(request).orgs;

        await updateItem.execute(dashboardId, itemId, input, orgs);

        response.status(204).send('');
    };
}
