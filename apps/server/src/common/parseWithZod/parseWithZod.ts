import { ValidationError } from '@/core/errors';
import { ZodError } from 'zod';

/**
 * automatically throws validation error with 400 code if validation fails
 *
 * @export
 * @template T
 * @param {() => T} parse
 * @returns {T}
 */
export function parseWithZod<T>(parse: () => T): T {
    try {
        return parse();
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
