import type { z } from 'zod';

import type { logoutSchema } from './schema';

export type LogoutInput = z.infer<typeof logoutSchema>;
