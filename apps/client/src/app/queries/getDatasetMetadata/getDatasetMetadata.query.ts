import type {
    DatasetMetadata,
    DatasetRepo,
    DatasetScope,
} from '@/app/ports/repos/dataset';

import type { Query } from '../query';

export function createGetDatasetMetadata(
    repo: DatasetRepo
): Query<DatasetScope, DatasetMetadata> {
    return {
        name: 'getDatasetMetadata',
        execute: (input, options) => repo.getDatasetMetadata(input, options),
        reads: input => [
            `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
            'datasetColumn',
            'datasetRow',
        ],
    };
}
