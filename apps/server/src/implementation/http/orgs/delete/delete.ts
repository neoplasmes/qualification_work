import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';
import { deleteOrgSchema, type DeleteOrgHandler } from '@/core/commands';

export function createDeleteOrgHandler(handler: DeleteOrgHandler): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(() => deleteOrgSchema.parse(body));

        await handler.execute(input);

        response.status(204).send('');
    };
}
