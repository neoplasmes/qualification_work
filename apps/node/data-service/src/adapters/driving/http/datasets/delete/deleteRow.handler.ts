import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { DeleteRowCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const deleteRowSchema = z.object({
    datasetId: z.uuid(),
    rowIds: z.array(z.uuid()).min(1),
    orgId: z.uuid(),
});

export function createDeleteRowHandler(handler: DeleteRowCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');
        const body = await request.json<{ rowIds?: string[] }>();

        const input = parseWithZod(deleteRowSchema, {
            datasetId: request.params.id,
            rowIds: body.rowIds,
            orgId: orgIdFromRequest,
        });

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
