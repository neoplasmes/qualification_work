import { z } from 'zod';

export const meSchema = z.object({
    token: z.string().min(1),
});
