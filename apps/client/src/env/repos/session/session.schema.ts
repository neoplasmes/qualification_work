import { z } from 'zod';

export const sessionSchema = z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
    family: z.string().min(1),
    isInitializing: z.boolean(),
    organizations: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            role: z.enum(['owner', 'editor', 'viewer']),
        })
    ),
});
