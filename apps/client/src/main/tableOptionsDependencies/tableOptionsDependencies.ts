import { valueCodec } from '@/env/cache/normalize';
import type { CacheRuntime } from '@/env/cache/runtime';
import { IdbDatasetTableOptionsRepo } from '@/env/repos/datasetTableOptions';

import { createRemoveDatasetTableOptions } from '@/app/commands/removeDatasetTableOptions';
import { createSaveDatasetTableOptions } from '@/app/commands/saveDatasetTableOptions';
import type { DatasetTableOptionsRepo } from '@/app/ports/repos/datasetTableOptions';
import { createGetDatasetTableOptions } from '@/app/queries/getDatasetTableOptions';

export function createTableOptionsDependencies(cache: CacheRuntime, browser: boolean) {
    // main composes one shared local preferences repo for this runtime
    const repo: DatasetTableOptionsRepo = browser
        ? new IdbDatasetTableOptionsRepo()
        : {
              get: async () => undefined,
              set: async () => {
                  throw new Error('Table preferences require a browser');
              },
              remove: async () => {
                  throw new Error('Table preferences require a browser');
              },
          };
    const operations = {
        getDatasetTableOptions: createGetDatasetTableOptions(repo),
        saveDatasetTableOptions: createSaveDatasetTableOptions(repo),
        removeDatasetTableOptions: createRemoveDatasetTableOptions(repo),
    };
    cache.registerRead(operations.getDatasetTableOptions, valueCodec());
    for (const command of [
        operations.saveDatasetTableOptions,
        operations.removeDatasetTableOptions,
    ]) {
        cache.registerCommand(command, {
            conflictKey: input => `tableOptions:${input.datasetId}`,
            affected: input => [
                `datasetTableOptions:${encodeURIComponent(input.datasetId)}`,
            ],
            codec: valueCodec(),
            removals: () => [],
        });
    }

    return operations;
}
