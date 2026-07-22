import type {
    ColumnWidths,
    DatasetTableOptionsRepo,
    TableOptionsScope,
} from '@/app/ports/repos/datasetTableOptions';
import { DatasetTableOptionsService } from '@/app/services/datasetTableOptions';

import type { Query } from '../query';

export function createGetDatasetTableOptions(
    repo: DatasetTableOptionsRepo
): Query<TableOptionsScope, ColumnWidths> {
    const service = new DatasetTableOptionsService(repo);

    return {
        name: 'getDatasetTableOptions',
        execute: input => service.getColumnWidths(input.datasetId),
        reads: input => [`datasetTableOptions:${encodeURIComponent(input.datasetId)}`],
    };
}
