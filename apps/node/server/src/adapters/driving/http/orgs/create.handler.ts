import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { CreateOrgCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const createOrgSchema = z.object({
    name: z.string().min(1),
    ownerId: z.uuid(),
});

export function createCreateOrgHandler(handler: CreateOrgCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(createOrgSchema, body);

        const { id } = await handler.execute(input.name, input.ownerId);

        response.status(201).json({ id });
    };
}
