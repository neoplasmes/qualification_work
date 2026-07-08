import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { GetActionsByOrgIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const getActionsByOrgIdSchema = z.object({
    orgId: z.uuid(),
});

export function createGetActionsByOrgIdHandler(
    handler: GetActionsByOrgIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(getActionsByOrgIdSchema, {
            orgId: request.query.orgId,
        });
        const identity = getInternalIdentity(request);

        const result = await handler.execute(input.orgId, identity.orgs);

        response.status(200).json(result);
    };
}
