import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { DeleteOrgCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const deleteOrgSchema = z.object({
    id: z.uuid(),
});

export function createDeleteOrgHandler(handler: DeleteOrgCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(deleteOrgSchema, {
            id: request.params.id,
        });

        await handler.execute(input.id);

        response.status(204).send('');
    };
}
