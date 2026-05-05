import { z } from 'zod';

import type { GetDatasetsMetadataByOrgIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

const getDatasetsMetadataByOrgIdSchema = z.object({
    orgId: z.uuid(),
});

export function createGetDatasetsMetadataByOrgIdHandler(
    handler: GetDatasetsMetadataByOrgIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(() =>
            getDatasetsMetadataByOrgIdSchema.parse({
                orgId: request.query.orgId,
            })
        );

        const result = await handler.execute(input.orgId);

        response.status(200).json(result);
    };
}
