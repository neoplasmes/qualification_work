import { z } from 'zod';

export const getDatasetRowsSchema = z.object({
    id: z.uuid(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(500).default(50),
});
