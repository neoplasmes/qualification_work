import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { ExecuteActionCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

import { executeActionSchema } from '../schemas';

export function createExecuteActionHandler(
    handler: ExecuteActionCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const actionId = parseWithZod(z.uuid(), request.params.id);
        const rawBody = await request.json<unknown>();
        const input = parseWithZod(executeActionSchema, rawBody);
        const identity = getInternalIdentity(request);

        const result = await handler.execute({
            actionId,
            userId: identity.userId,
            orgs: identity.orgs,
            parameters: input.parameters,
        });

        response.status(201).json(result);
    };
}
