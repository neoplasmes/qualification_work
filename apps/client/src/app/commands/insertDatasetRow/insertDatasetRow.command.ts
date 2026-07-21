import type { DatasetRow } from '@/core/entities/datasetRow';
import { datasetChanges } from '@/core/processes/datasetChanges';

import type { DatasetRepo, InsertDatasetRowInput } from '@/app/ports/repos/dataset';

import type { Command } from '../command';

export function createInsertDatasetRow(
    repo: DatasetRepo
): Command<InsertDatasetRowInput, DatasetRow> {
    return {
        execute: input => repo.insertDatasetRow(input),
        writes: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'content'
            ),
    };
}
