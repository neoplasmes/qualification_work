import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';
import { metricTimeBuckets } from '@qualification-work/types';

import type { EvaluateMetricsQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

// a dashboard rarely holds more, the cap bounds the scans of one request
const maxItems = 50;

const evaluateSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().min(1),
                datasetId: z.uuid(),
                expression: z.string().min(1),
                showTrend: z.boolean(),
                timeColumn: z.string().nullable(),
                timeBucket: z.enum(metricTimeBuckets).nullable(),
            })
        )
        .max(maxItems),
});

export function createEvaluateMetricsHandler(
    handler: EvaluateMetricsQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(evaluateSchema, await request.json<unknown>());
        const identity = getInternalIdentity(request);

        const result = await handler.execute({ items: input.items, orgs: identity.orgs });

        response.status(200).json(result);
    };
}
