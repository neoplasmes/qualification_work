import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { PreviewMetricQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const previewSchema = z.object({
    datasetId: z.uuid(),
    expression: z.string().min(1),
});

export function createPreviewMetricHandler(
    handler: PreviewMetricQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(previewSchema, await request.json<unknown>());
        const identity = getInternalIdentity(request);

        const result = await handler.execute({ ...input, orgs: identity.orgs });

        response.status(200).json(result);
    };
}
