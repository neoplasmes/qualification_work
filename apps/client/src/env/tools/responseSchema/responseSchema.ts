import { ContractViolationError } from '@/env/transport/http';
import { z } from 'zod';

export const receiptSchema = z.object({ id: z.string().min(1) });
export const errorPayloadSchema = z.object({
    error: z.string().optional(),
    fields: z.union([z.record(z.string(), z.string()), z.array(z.string())]).optional(),
});

export function parseResponse<T>(schema: z.ZodType<T>, response: unknown): T {
    const result = schema.safeParse(response);
    if (!result.success) {
        throw new ContractViolationError('Invalid response data', {
            cause: result.error,
        });
    }

    return result.data;
}
