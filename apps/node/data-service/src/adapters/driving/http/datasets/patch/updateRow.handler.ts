import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { UpdateRowValuesCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const updateRowSchema = z.object({
    datasetId: z.uuid(),
    rowIds: z.array(z.uuid()).min(1),
    orgId: z.uuid(),
    values: z.record(z.string(), z.unknown()),
});

export function createUpdateRowHandler(
    handler: UpdateRowValuesCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');
        const body = await request.json<{
            rowIds?: string[];
            values?: Record<string, unknown>;
        }>();

        const input = parseWithZod(updateRowSchema, {
            datasetId: request.params.id,
            rowIds: body.rowIds,
            orgId: orgIdFromRequest,
            values: body.values,
        });

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
