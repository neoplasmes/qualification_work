import type { DatasetRow } from '@/core/entities/datasetRow';
import { datasetChanges } from '@/core/processes/datasetChanges';

import type { DatasetRepo, UpdateDatasetRowsInput } from '@/app/ports/repos/dataset';

import type { Command } from '../command';

export function createUpdateDatasetRows(
    repo: DatasetRepo
): Command<UpdateDatasetRowsInput, DatasetRow[]> {
    return {
        execute: input => repo.updateDatasetRows(input),
        writes: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'content'
            ),
    };
}
