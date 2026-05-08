import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { GetDatasetRowsQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const getDatasetRowsSchema = z.object({
    id: z.uuid(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(500).default(50),
});

export function createGetDatasetRowsHandler(
    handler: GetDatasetRowsQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(getDatasetRowsSchema, {
            id: request.params.id,
            offset: request.query.offset,
            limit: request.query.limit,
        });

        const result = await handler.execute(input.id, input.offset, input.limit);

        response.status(200).json(result);
    };
}
