import type { z } from 'zod';
import type { createOrgSchema } from './schema';

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
