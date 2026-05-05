import { z } from 'zod';

import type { DeleteOrgCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

const deleteOrgSchema = z.object({
    id: z.uuid(),
});

export function createDeleteOrgHandler(handler: DeleteOrgCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(() =>
            deleteOrgSchema.parse({
                id: request.params.id,
            })
        );

        await handler.execute(input.id);

        response.status(204).send('');
    };
}
