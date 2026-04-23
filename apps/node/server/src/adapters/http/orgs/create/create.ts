import { createOrgSchema, type CreateOrgHandler } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

export function createCreateOrgHandler(handler: CreateOrgHandler): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(() => createOrgSchema.parse(body));

        const { id } = await handler.execute(input);

        response.status(201).json({ id });
    };
}
