import { valueCodec } from '@/env/cache/normalize';
import type { CacheRuntime } from '@/env/cache/runtime';
import { HttpUploadRepo } from '@/env/repos/upload';
import { UploadRegistry } from '@/env/tools/uploadRegistry';
import type { HttpTransport } from '@/env/transport/http';

import { createCancelDatasetMerge } from '@/app/commands/cancelDatasetMerge';
import { createCommitDatasetMerge } from '@/app/commands/commitDatasetMerge';
import { createPreviewDatasetMerge } from '@/app/commands/previewDatasetMerge';
import { createUploadDataset } from '@/app/commands/uploadDataset';

export function createUploadDependencies(cache: CacheRuntime, transport: HttpTransport) {
    const uploads = new UploadRegistry();
    const repo = new HttpUploadRepo(transport, uploads.resolve);
    const operations = {
        uploadDataset: createUploadDataset(repo),
        previewDatasetMerge: createPreviewDatasetMerge(repo),
        commitDatasetMerge: createCommitDatasetMerge(repo),
        cancelDatasetMerge: createCancelDatasetMerge(repo),
    };
    cache.registerCommand(operations.uploadDataset, {
        conflictKey: input => `orgData:${input.orgId}`,
        affected: () => ['dataset'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.previewDatasetMerge, {
        conflictKey: input => `orgData:${input.orgId}`,
        affected: () => [],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.commitDatasetMerge, {
        conflictKey: input => `orgData:${input.orgId}`,
        affected: () => [
            'dataset',
            'datasetRow',
            'datasetColumn',
            'chartData',
            'metricPreview',
            'dashboard',
        ],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.cancelDatasetMerge, {
        conflictKey: input => `orgData:${input.orgId}`,
        affected: () => [],
        codec: valueCodec(),
        removals: () => [],
    });

    return { ...operations, uploads };
}
