import type {
    DatasetMetadata,
    DatasetRepo,
    ListDatasetsInput,
} from '@/app/ports/repos/dataset';

import type { Query } from '../query';

export function createListDatasets(
    repo: DatasetRepo
): Query<ListDatasetsInput, DatasetMetadata[]> {
    return {
        name: 'listDatasets',
        execute: (input, options) => repo.listDatasets(input, options),
        reads: () => ['dataset', 'datasetColumn'],
    };
}
