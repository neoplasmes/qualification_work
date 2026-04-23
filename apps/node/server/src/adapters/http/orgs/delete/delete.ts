import { deleteOrgSchema, type DeleteOrgHandler } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

export function createDeleteOrgHandler(handler: DeleteOrgHandler): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(() =>
            deleteOrgSchema.parse({
                id: request.params.id,
            })
        );

        await handler.execute(input);

        response.status(204).send('');
    };
}
