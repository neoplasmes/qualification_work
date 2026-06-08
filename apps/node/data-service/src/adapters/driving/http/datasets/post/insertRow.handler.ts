import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils/validation';

import type { InsertRowCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const insertRowSchema = z.object({
    datasetId: z.uuid(),
    orgId: z.uuid(),
    afterRowId: z.uuid().optional(),
    data: z.record(z.string(), z.unknown()),
});

export function createInsertRowHandler(handler: InsertRowCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');
        const body = await request.json<{
            afterRowId?: string;
            data?: Record<string, unknown>;
        }>();

        const input = parseWithZod(insertRowSchema, {
            datasetId: request.params.id,
            orgId: orgIdFromRequest,
            afterRowId: body.afterRowId,
            data: body.data,
        });

        const result = await handler.execute(input);

        response.status(201).json(result);
    };
}
