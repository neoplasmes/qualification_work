import type { z } from 'zod';

import type { deleteOrgSchema } from './schema';

export type DeleteOrgInput = z.infer<typeof deleteOrgSchema>;
