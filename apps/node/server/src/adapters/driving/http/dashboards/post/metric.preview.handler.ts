import { z } from 'zod';

import { getInternalIdentity } from '@qualification-work/microservice-utils/auth';
import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { PreviewDashboardMetricQuery } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';

const previewMetricSchema = z.object({
    datasetId: z.uuid(),
    expression: z.string().trim().min(1),
});

export function createPreviewMetricHandler(
    previewMetric: PreviewDashboardMetricQuery
): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();
        const input = parseWithZod(previewMetricSchema, body);
        const orgs = getInternalIdentity(request).orgs;

        const result = await previewMetric.execute(input, orgs);

        response.status(200).json(result);
    };
}
