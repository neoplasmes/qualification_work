import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { UpdateColumnAnalysisCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const updateColumnAnalysisSchema = z.object({
    datasetId: z.uuid(),
    columnId: z.uuid(),
    orgId: z.uuid(),
    isAnalyzable: z.boolean(),
});

export function createUpdateColumnAnalysisHandler(
    handler: UpdateColumnAnalysisCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');
        const body = await request.json<{ isAnalyzable?: boolean }>();

        const input = parseWithZod(updateColumnAnalysisSchema, {
            datasetId: request.params.id,
            columnId: request.params.columnId,
            orgId: orgIdFromRequest,
            isAnalyzable: body.isAnalyzable,
        });

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
