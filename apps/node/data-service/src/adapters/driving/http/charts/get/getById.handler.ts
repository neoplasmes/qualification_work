import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { GetChartByIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

export function createGetChartByIdHandler(
    handler: GetChartByIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);
        const identity = getInternalIdentity(request);

        const result = await handler.execute(id, identity.orgs);

        response.status(200).json(result);
    };
}
