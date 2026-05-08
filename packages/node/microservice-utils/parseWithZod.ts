import { ZodError } from 'zod';

import { ValidationError } from './errors.js';

/**
 * automatically throws validation error with 400 code if validation fails
 *
 * @export
 * @template T
 * @param {{ parse(data: unknown): T }} schema
 * @param {unknown} data
 * @returns {T}
 */
export function parseWithZod<T>(schema: { parse(data: unknown): T }, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (err) {
        if (err instanceof ZodError) {
            const uniquePaths = new Set<string>();
            const fields: string[] = [];

            err.issues.forEach(issue => {
                const path = (
                    issue.path.length === 1 ? issue.path[0] : issue.path.join('.')
                ) as string;
                //prettier-ignore

                if (!uniquePaths.has(path)) {
                    fields.push(path);
                    uniquePaths.add(path);
                }
            });

            throw new ValidationError(fields);
        }

        throw err;
    }
}
