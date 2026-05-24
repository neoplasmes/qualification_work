import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';
import { parseWithZod } from '@qualification-work/microservice-utils';

import type { ArchiveActionCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

export function createArchiveActionHandler(
    handler: ArchiveActionCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const identity = getInternalIdentity(request);

        await handler.execute(id, identity.orgs);

        response.status(204).end();
    };
}
