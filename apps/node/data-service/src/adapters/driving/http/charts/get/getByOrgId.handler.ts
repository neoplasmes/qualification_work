import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { GetChartsByOrgIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

export function createGetChartsByOrgIdHandler(
    handler: GetChartsByOrgIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const orgId = parseWithZod(z.uuid(), request.query.orgId);
        const identity = getInternalIdentity(request);

        const result = await handler.execute(orgId, identity.orgs);

        response.status(200).json(result);
    };
}
