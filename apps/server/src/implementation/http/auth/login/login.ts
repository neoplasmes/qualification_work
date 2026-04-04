import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';
import { loginSchema, type LoginHandler } from '@/core/commands';
import { SESSION_TTL_SECONDS } from '@/core/entities';

// TODO: add "secure" flag to cookie before moving to https.
// TODO: maybe add "encrypted" property into AppState for the developer experience
export function createLoginHandler(handler: LoginHandler): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(() => loginSchema.parse(body));

        const { token } = await handler.execute(input);

        response
            .head(
                'set-cookie',
                `session=${token};HttpOnly;Path=/;SameSite=Strict;Max-Age=${SESSION_TTL_SECONDS}`
            )
            .status(204)
            .send('');
    };
}
