import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

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

        const result = await handler.execute(input.orgId);

        response.status(200).json(result);
    };
}
