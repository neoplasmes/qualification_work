import { datasetChanges } from '@/core/processes/datasetChanges';

import type { UploadInput, UploadRepo, UploadResult } from '@/app/ports/repos/upload';

import type { Command } from '../command';

export function createUploadDataset(
    repo: UploadRepo
): Command<UploadInput, UploadResult> {
    return {
        execute: input => repo.uploadDataset(input),
        writes: (input, output) =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(output.id)}`,
                'metadata'
            ),
    };
}
