import { getDatasetRowsSchema, type GetDatasetRowsHandler } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

export function createGetDatasetRowsHandler(
    handler: GetDatasetRowsHandler
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(() =>
            getDatasetRowsSchema.parse({
                id: request.params.id,
                offset: request.query.offset,
                limit: request.query.limit,
            })
        );

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
