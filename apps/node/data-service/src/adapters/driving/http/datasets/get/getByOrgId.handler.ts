import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { GetDatasetsMetadataByOrgIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const getDatasetsMetadataByOrgIdSchema = z.object({
    orgId: z.uuid(),
});

export function createGetDatasetsMetadataByOrgIdHandler(
    handler: GetDatasetsMetadataByOrgIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(getDatasetsMetadataByOrgIdSchema, {
            orgId: request.query.orgId,
        });
        const identity = getInternalIdentity(request);

        const result = await handler.execute(input.orgId, identity.orgs);

        response.status(200).json(result);
    };
}
