import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { UpdateActionCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

import { actionDefinitionSchema } from '../schemas';

export function createUpdateActionHandler(
    handler: UpdateActionCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const rawBody = await request.json<unknown>();
        const input = parseWithZod(actionDefinitionSchema, rawBody);
        const identity = getInternalIdentity(request);

        await handler.execute(
            id,
            {
                name: input.name,
                description: input.description ?? null,
                parameters: input.parameters,
                effects: input.effects,
            },
            identity.orgs
        );

        response.status(204).end();
    };
}
