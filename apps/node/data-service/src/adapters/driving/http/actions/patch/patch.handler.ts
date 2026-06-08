import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { PatchActionCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

import { patchActionSchema } from '../schemas';

export function createPatchActionHandler(
    handler: PatchActionCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const rawBody = await request.json<unknown>();
        const input = parseWithZod(patchActionSchema, rawBody);
        const identity = getInternalIdentity(request);

        await handler.execute(
            id,
            {
                name: input.name,
                description: input.description,
                parameters: input.parameters,
                effects: input.effects,
            },
            identity.orgs
        );

        response.status(204).end();
    };
}
