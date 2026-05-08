import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { GetChartByIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

export function createGetChartByIdHandler(
    handler: GetChartByIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);

        const result = await handler.execute(id);

        response.status(200).json(result);
    };
}
