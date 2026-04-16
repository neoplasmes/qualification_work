import type { z } from 'zod';

import type { registerSchema } from './schema';

export type RegisterInput = z.infer<typeof registerSchema>;
