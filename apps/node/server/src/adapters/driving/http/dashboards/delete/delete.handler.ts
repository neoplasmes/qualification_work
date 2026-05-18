import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { DeleteDashboardCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const paramsSchema = z.object({ id: z.uuid() });

export function createDeleteDashboardHandler(
    handler: DeleteDashboardCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const { id } = parseWithZod(paramsSchema, { id: request.params.id });

        const orgs = getInternalIdentity(request).orgs;

        await handler.execute(id, orgs);

        response.status(204).send('');
    };
}
