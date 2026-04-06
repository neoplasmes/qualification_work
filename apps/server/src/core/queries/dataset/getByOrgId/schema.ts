import { z } from 'zod';

export const getDatasetsMetadataByOrgIdSchema = z.object({
    orgId: z.uuid(),
});
