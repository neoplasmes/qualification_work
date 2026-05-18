import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { ReorderDashboardCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const reorderSchema = z.object({
    id: z.uuid(),
    order: z
        .array(
            z.object({
                itemId: z.uuid(),
                posY: z.number().int().min(0),
            })
        )
        .min(1),
});

export function createReorderItemsHandler(
    handler: ReorderDashboardCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();
        const input = parseWithZod(reorderSchema, {
            id: request.params.id,
            order: (body as { order?: unknown })?.order,
        });

        const orgs = getInternalIdentity(request).orgs;

        await handler.execute(input.id, input.order, orgs);

        response.status(204).send('');
    };
}
