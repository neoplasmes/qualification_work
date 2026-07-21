import { datasetChanges } from '@/core/processes/datasetChanges';

import type { DatasetRepo, PatchDatasetInput } from '@/app/ports/repos/dataset';

import type { Command } from '../command';

export function createPatchDataset(repo: DatasetRepo): Command<PatchDatasetInput, void> {
    return {
        execute: input => repo.patchDataset(input),
        writes: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'metadata'
            ),
    };
}
