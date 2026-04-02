import type { RequestHandlerType } from '@/common/appState';
import { parseWithZod } from '@/common/parseWithZod';
import { registerSchema, type RegisterHandler } from '@/core/commands';

/**
 * @example {
 *  password: string;
 *  email: string;
 *  name: string;
 *  family: string;
 * }
 */
export function createRegisterHandler(handler: RegisterHandler): RequestHandlerType {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(() => registerSchema.parse(body));

        const { id } = await handler.execute(input);

        response.status(201).json({ id });
    };
}
