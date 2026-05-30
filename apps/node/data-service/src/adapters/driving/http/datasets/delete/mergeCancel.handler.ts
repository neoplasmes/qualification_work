import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { CancelMergeCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const cancelSchema = z.object({
    sessionId: z.uuid(),
    orgId: z.uuid(),
});

export function createMergeCancelHandler(
    handler: CancelMergeCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(cancelSchema, {
            sessionId: request.params.sessionId,
            orgId: request.query.orgId ?? request.getHeader('x-org-id'),
        });

        await handler.execute(input);

        response.status(204).end();
    };
}
