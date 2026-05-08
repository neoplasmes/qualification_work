import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { DeleteChartCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

export function createDeleteChartHandler(
    handler: DeleteChartCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);

        await handler.execute(id);

        response.status(204).end();
    };
}
