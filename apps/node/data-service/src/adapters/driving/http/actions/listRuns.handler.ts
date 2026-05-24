import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';
import { parseWithZod } from '@qualification-work/microservice-utils';

import type { ListActionRunsQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

import { actionRunsQuerySchema } from './schemas';

export function createListOrgActionRunsHandler(
    handler: ListActionRunsQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(actionRunsQuerySchema, {
            orgId: request.query.orgId,
            offset: request.query.offset,
            limit: request.query.limit,
        });
        const identity = getInternalIdentity(request);

        const result = await handler.execute({
            kind: 'org',
            orgId: input.orgId,
            offset: input.offset,
            limit: input.limit,
            orgs: identity.orgs,
        });

        response.status(200).json(result);
    };
}

export function createListActionRunsHandler(
    handler: ListActionRunsQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const actionId = parseWithZod(z.uuid(), request.params.id);
        const input = parseWithZod(actionRunsQuerySchema, {
            orgId: request.query.orgId,
            offset: request.query.offset,
            limit: request.query.limit,
        });
        const identity = getInternalIdentity(request);

        const result = await handler.execute({
            kind: 'action',
            actionId,
            orgId: input.orgId,
            offset: input.offset,
            limit: input.limit,
            orgs: identity.orgs,
        });

        response.status(200).json(result);
    };
}
