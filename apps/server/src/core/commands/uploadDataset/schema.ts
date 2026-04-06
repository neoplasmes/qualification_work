import { z } from 'zod';

export const uploadDatasetSchema = z.object({
    orgId: z.uuid(),
});
