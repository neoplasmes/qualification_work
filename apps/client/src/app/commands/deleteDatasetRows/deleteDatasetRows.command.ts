import type { DatasetRow } from '@/core/entities/datasetRow';
import { datasetChanges } from '@/core/processes/datasetChanges';

import type { DatasetRepo, DeleteDatasetRowsInput } from '@/app/ports/repos/dataset';

import type { Command } from '../command';

export function createDeleteDatasetRows(
    repo: DatasetRepo
): Command<DeleteDatasetRowsInput, DatasetRow[]> {
    return {
        execute: input => repo.deleteDatasetRows(input),
        writes: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'content'
            ),
    };
}
