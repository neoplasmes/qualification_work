import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';
import { meSchema, type MeHandler } from '@/core/queries';

export function createMeHandler(handler: MeHandler): RequestHandlerType {
    return async ({ state, response }) => {
        const token = state.cookies['session'] ?? '';

        const input = parseWithZod(() => meSchema.parse({ token }));

        const result = await handler.execute(input);

        response.status(200).json(result);
    };
}
