import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { UpdateDashboardLayoutCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const layoutSchema = z.object({
    id: z.uuid(),
    layout: z.array(
        z.object({
            itemId: z.uuid(),
            posX: z.number().int().min(0),
            posY: z.number().int().min(0),
            width: z.number().int().min(1),
            height: z.number().int().min(1),
        })
    ),
});

export function createUpdateItemsLayoutHandler(
    handler: UpdateDashboardLayoutCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();
        const input = parseWithZod(layoutSchema, {
            id: request.params.id,
            layout: (body as { layout?: unknown })?.layout,
        });

        const orgs = getInternalIdentity(request).orgs;

        await handler.execute(input.id, input.layout, orgs);

        response.status(204).send('');
    };
}
