import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';
import { createOrgSchema, type CreateOrgHandler } from '@/core/commands';

export function createCreateOrgHandler(handler: CreateOrgHandler): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(() => createOrgSchema.parse(body));

        const { id } = await handler.execute(input);

        response.status(201).json({ id });
    };
}
