import type { RequestHandler } from 'primitive-server';
import { ZodError } from 'zod';

import { registerSchema, type RegisterHandler } from '@/core/commands';
import { ValidationError } from '@/core/errors';

function parseWithZod<T>(parse: () => T): T {
    try {
        return parse();
    } catch (err) {
        if (err instanceof ZodError) {
            const details: Record<string, string[]> = {};

            for (const issue of err.issues) {
                const key = issue.path.join('.');
                details[key] ??= [];
                details[key].push(issue.message);
            }

            throw new ValidationError('Ошибка валидации', details);
        }
        throw err;
    }
}

export function createRegisterHandler(handler: RegisterHandler): RequestHandler {
    return async ({ request, response }) => {
        const body = await request.json();

        const input = parseWithZod(() => registerSchema.parse(body));

        const id = await handler.execute(input);

        response.status(201).json({ id });
    };
}
