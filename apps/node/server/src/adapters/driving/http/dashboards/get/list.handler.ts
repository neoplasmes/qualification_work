import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { ListDashboardsQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const listDashboardsSchema = z.object({
    orgId: z.uuid(),
});

export function createListDashboardsHandler(
    handler: ListDashboardsQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(listDashboardsSchema, {
            orgId: request.query.orgId,
        });

        const orgs = getInternalIdentity(request).orgs;

        const dashboards = await handler.execute(input.orgId, orgs);

        response.status(200).json(dashboards);
    };
}
