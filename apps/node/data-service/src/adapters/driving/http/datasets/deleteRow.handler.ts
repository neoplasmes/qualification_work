import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { DeleteRowCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const deleteRowSchema = z.object({
    datasetId: z.uuid(),
    rowId: z.uuid(),
    orgId: z.uuid(),
});

export function createDeleteRowHandler(handler: DeleteRowCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');

        const input = parseWithZod(deleteRowSchema, {
            datasetId: request.params.id,
            rowId: request.params.rowId,
            orgId: orgIdFromRequest,
        });

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
