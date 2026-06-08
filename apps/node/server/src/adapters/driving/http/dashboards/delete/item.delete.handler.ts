import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { DeleteDashboardItemCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const paramsSchema = z.object({
    id: z.uuid(),
    itemId: z.uuid(),
});

export function createDeleteItemHandler(
    handler: DeleteDashboardItemCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(paramsSchema, {
            id: request.params.id,
            itemId: request.params.itemId,
        });

        const orgs = getInternalIdentity(request).orgs;

        await handler.execute(input.id, input.itemId, orgs);

        response.status(204).send('');
    };
}
