import type { z } from 'zod';

import type { DatasetRowsPage } from '@/core/ports';

import type { getDatasetRowsSchema } from './schema';

export type GetDatasetRowsInput = z.infer<typeof getDatasetRowsSchema>;

export type GetDatasetRowsOutput = DatasetRowsPage;
