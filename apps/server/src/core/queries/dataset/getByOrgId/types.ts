import type { z } from 'zod';

import type { DatasetMetadata } from '@/core/ports';

import type { getDatasetsMetadataByOrgIdSchema } from './schema';

export type GetDatasetsMetadataByOrgIdInput = z.infer<
    typeof getDatasetsMetadataByOrgIdSchema
>;

export type GetDatasetsMetadataByOrgIdOutput = DatasetMetadata[];
