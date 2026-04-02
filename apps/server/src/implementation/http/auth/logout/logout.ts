import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';
import { logoutSchema, type LogoutHandler } from '@/core/commands';

export function createLogoutHandler(handler: LogoutHandler): RequestHandlerType {
    return async ({ state, response }) => {
        const token = state.cookies['session'] ?? '';

        const input = parseWithZod(() => logoutSchema.parse({ token }));

        await handler.execute(input);

        response
            .setHeader('set-cookie', 'session=; HttpOnly; Path=/; Max-Age=0')
            .status(204)
            .send('');
    };
}
