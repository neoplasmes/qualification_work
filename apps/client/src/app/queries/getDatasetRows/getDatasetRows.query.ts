import type {
    DatasetRepo,
    DatasetRowsPage,
    GetDatasetRowsInput,
} from '@/app/ports/repos/dataset';

import type { Query } from '../query';

export function createGetDatasetRows(
    repo: DatasetRepo
): Query<GetDatasetRowsInput, DatasetRowsPage> {
    return {
        name: 'getDatasetRows',
        execute: (input, options) => repo.getDatasetRows(input, options),
        reads: input => [
            `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
            'datasetRow',
            'datasetColumn',
        ],
    };
}
