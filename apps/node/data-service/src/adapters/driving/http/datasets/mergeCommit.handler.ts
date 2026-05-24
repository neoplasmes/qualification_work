import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { CommitMergeCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

const commitSchema = z.object({
    sessionId: z.uuid(),
    orgId: z.uuid(),
});

export function createMergeCommitHandler(handler: CommitMergeCommand): RequestHandlerType {
    return async ({ request, response }) => {
        const input = parseWithZod(commitSchema, {
            sessionId: request.params.sessionId,
            orgId: request.query.orgId ?? request.getHeader('x-org-id'),
        });

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
