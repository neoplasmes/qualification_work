import type {
    DatasetTableOptionsRepo,
    TableOptionsScope,
} from '@/app/ports/repos/datasetTableOptions';

import type { Command } from '../command';

export function createRemoveDatasetTableOptions(
    repo: DatasetTableOptionsRepo
): Command<TableOptionsScope, void> {
    return {
        execute: input => repo.remove(input.datasetId),
        writes: input => [`datasetTableOptions:${encodeURIComponent(input.datasetId)}`],
    };
}
