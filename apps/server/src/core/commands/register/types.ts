import type { registerSchema } from './schema';

export type RegisterInput = (typeof registerSchema)['_zod']['input'];
