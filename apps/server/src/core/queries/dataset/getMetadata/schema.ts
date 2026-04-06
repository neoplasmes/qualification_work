import { z } from 'zod';

export const getDatasetMetadataSchema = z.object({
    id: z.uuid(),
});
