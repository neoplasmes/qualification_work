import type { z } from 'zod';

import type { MultipartFile } from '@/core/ports/services';

import type { uploadDatasetSchema } from './schema';

export type UploadDatasetInput = z.infer<typeof uploadDatasetSchema> & MultipartFile;
