import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { CreateDashboardCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const createDashboardSchema = z.object({
    orgId: z.uuid(),
    name: z.string().trim().min(1).max(255),
});

export function createCreateDashboardHandler(
    handler: CreateDashboardCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();
        const input = parseWithZod(createDashboardSchema, body);

        const orgs = getInternalIdentity(request).orgs;

        const id = await handler.execute(input.orgId, input.name, orgs);

        response.status(201).json({ id });
    };
}
