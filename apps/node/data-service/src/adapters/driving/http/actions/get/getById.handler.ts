import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { GetActionByIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

export function createGetActionByIdHandler(
    handler: GetActionByIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const identity = getInternalIdentity(request);

        const result = await handler.execute(id, identity.orgs);

        response.status(200).json(result);
    };
}
