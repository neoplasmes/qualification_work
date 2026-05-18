import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { RenameDashboardCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const renameSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(255),
});

export function createRenameDashboardHandler(
    handler: RenameDashboardCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();
        const input = parseWithZod(renameSchema, {
            id: request.params.id,
            name: (body as { name?: unknown })?.name,
        });

        const orgs = getInternalIdentity(request).orgs;

        await handler.execute(input.id, input.name, orgs);

        response.status(204).send('');
    };
}
