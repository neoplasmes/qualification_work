import { z } from 'zod';

export const deleteOrgSchema = z.object({
    id: z.uuid(),
});
