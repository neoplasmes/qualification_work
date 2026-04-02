import type { z } from 'zod';
import type { loginSchema } from './schema';

export type LoginInput = z.infer<typeof loginSchema>;
