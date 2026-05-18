import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { GetDashboardQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const paramsSchema = z.object({ id: z.uuid() });

export function createGetDashboardHandler(
    handler: GetDashboardQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const { id } = parseWithZod(paramsSchema, { id: request.params.id });

        const orgs = getInternalIdentity(request).orgs;

        const dashboard = await handler.execute(id, orgs);

        response.status(200).json(dashboard);
    };
}
