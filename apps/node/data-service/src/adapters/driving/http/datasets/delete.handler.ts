import { z } from 'zod';

import { parseWithZod } from '@qualification-work/microservice-utils';

import type { DeleteDatasetCommand } from '@/core/commands';

import type { RequestHandlerType } from '@/shared/appState';

export function createDeleteDatasetHandler(
    handler: DeleteDatasetCommand
): RequestHandlerType {
    return async ({ request, response }) => {
        const id = parseWithZod(z.uuid(), request.params.id);

        await handler.execute(id);

        response.status(204).end();
    };
}
