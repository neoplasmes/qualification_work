import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

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

        const result = await handler.execute(input.id);

        response.status(200).json(result);
    };
}
