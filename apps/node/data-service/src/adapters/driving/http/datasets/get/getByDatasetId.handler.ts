import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { GetDatasetMetadataByDatasetIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const getDatasetMetadataSchema = z.object({
    id: z.uuid(),
});

export function createGetDatasetMetadataByDatasetIdHandler(
    handler: GetDatasetMetadataByDatasetIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(getDatasetMetadataSchema, {
            id: request.params.id,
        });
        const identity = getInternalIdentity(request);

        const result = await handler.execute(input.id, identity.orgs);

        response.status(200).json(result);
    };
}
