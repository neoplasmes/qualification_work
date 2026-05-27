import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { PatchDatasetCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const patchDatasetSchema = z
    .object({
        name: z.string().min(1).max(255).optional(),
    })
    .refine(value => Object.keys(value).length > 0, {
        message: 'patch body is empty',
    });

export function createPatchDatasetHandler(
    handler: PatchDatasetCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const body = parseWithZod(patchDatasetSchema, await request.json<unknown>());
        const identity = getInternalIdentity(request);

        await handler.execute(id, { name: body.name }, identity.orgs);

        response.status(204).end();
    };
}
