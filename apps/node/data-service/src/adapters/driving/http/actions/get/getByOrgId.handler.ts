import { parseWithZod } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';

import type { GetActionsByOrgIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

import { actionRunsQuerySchema } from '../schemas';

export function createGetActionsByOrgIdHandler(
    handler: GetActionsByOrgIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(actionRunsQuerySchema.pick({ orgId: true }), {
            orgId: request.query.orgId,
        });
        const identity = getInternalIdentity(request);

        const result = await handler.execute(input.orgId, identity.orgs);

        response.status(200).json(result);
    };
}
