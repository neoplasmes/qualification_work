import { z } from 'zod';

export const registerSchema = z.object({
    password: z.string().min(8),
    email: z.email(),
    name: z.string().min(1),
    family: z.string().min(1),
});
