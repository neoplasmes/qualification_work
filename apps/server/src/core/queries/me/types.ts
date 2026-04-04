import type { User } from '@/core/entities';
import type { z } from 'zod';

import type { meSchema } from './schema';

export type MeInput = z.infer<typeof meSchema>;

export type MeOutput = Pick<User, 'id' | 'email' | 'name' | 'family'> & {
    organizations: {} & { role: string }[];
};
