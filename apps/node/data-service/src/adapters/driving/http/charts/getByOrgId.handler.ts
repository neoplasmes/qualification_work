import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { GetChartsByOrgIdQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

export function createGetChartsByOrgIdHandler(
    handler: GetChartsByOrgIdQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const orgId = parseWithZod(z.uuid(), request.query.orgId);

        const result = await handler.execute(orgId);

        response.status(200).json(result);
    };
}
