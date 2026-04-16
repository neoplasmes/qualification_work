import type { z } from 'zod';

import type { DatasetMetadata } from '@/core/ports';

import type { getDatasetMetadataSchema } from './schema';

export type GetDatasetMetadataInput = z.infer<typeof getDatasetMetadataSchema>;

export type GetDatasetMetadataOutput = DatasetMetadata;
