import {
    getDatasetsMetadataByOrgIdSchema,
    type GetDatasetsMetadataByOrgIdHandler,
} from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

export function createGetDatasetsMetadataByOrgIdHandler(
    handler: GetDatasetsMetadataByOrgIdHandler
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(() =>
            getDatasetsMetadataByOrgIdSchema.parse({
                orgId: request.query.orgId,
            })
        );

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
