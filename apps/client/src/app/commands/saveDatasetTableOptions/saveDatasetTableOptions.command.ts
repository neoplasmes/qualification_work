import type {
    DatasetTableOptionsRepo,
    SaveTableOptionsInput,
} from '@/app/ports/repos/datasetTableOptions';
import { DatasetTableOptionsService } from '@/app/services/datasetTableOptions';

import type { Command } from '../command';

export function createSaveDatasetTableOptions(
    repo: DatasetTableOptionsRepo
): Command<SaveTableOptionsInput, void> {
    const service = new DatasetTableOptionsService(repo);

    return {
        execute: input => service.saveColumnWidths(input.datasetId, input.widths),
        writes: input => [`datasetTableOptions:${encodeURIComponent(input.datasetId)}`],
    };
}
