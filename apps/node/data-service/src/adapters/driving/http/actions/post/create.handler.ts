import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { CreateActionCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

import { createActionSchema } from '../schemas';

export function createCreateActionHandler(
    handler: CreateActionCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const rawBody = await request.json<unknown>();
        const input = parseWithZod(createActionSchema, rawBody);
        const identity = getInternalIdentity(request);

        const result = await handler.execute(
            {
                orgId: input.orgId,
                name: input.name,
                description: input.description ?? null,
                parameters: input.parameters,
                effects: input.effects,
            },
            identity.orgs
        );

        response.status(201).json(result);
    };
}
