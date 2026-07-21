import { datasetChanges } from '@/core/processes/datasetChanges';

import type { DatasetRepo, DatasetScope } from '@/app/ports/repos/dataset';

import type { Command } from '../command';

export function createDeleteDataset(repo: DatasetRepo): Command<DatasetScope, void> {
    return {
        execute: input => repo.deleteDataset(input),
        writes: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'removed'
            ),
    };
}
