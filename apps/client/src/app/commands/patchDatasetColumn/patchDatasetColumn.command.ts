import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { datasetChanges } from '@/core/processes/datasetChanges';

import type { DatasetRepo, PatchDatasetColumnInput } from '@/app/ports/repos/dataset';

import type { Command } from '../command';

export function createPatchDatasetColumn(
    repo: DatasetRepo
): Command<PatchDatasetColumnInput, DatasetColumn> {
    return {
        execute: input => repo.patchDatasetColumn(input),
        writes: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'content'
            ),
    };
}
