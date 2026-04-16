import { getDatasetMetadataSchema, type GetDatasetMetadataHandler } from '@/core/queries';

import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';

export function createGetDatasetMetadataHandler(
    handler: GetDatasetMetadataHandler
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(() =>
            getDatasetMetadataSchema.parse({
                id: request.params.id,
            })
        );

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
