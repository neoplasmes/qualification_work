import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import { datasetChanges } from '@/core/processes/datasetChanges';
import {
    datasetColumnCodec,
    datasetListCodec,
    datasetMetadataCodec,
    datasetRowCodec,
    datasetRowListCodec,
    datasetRowsCodec,
    valueCodec,
} from '@/env/cache/normalize';
import type { CacheRuntime } from '@/env/cache/runtime';
import { HttpDatasetRepo } from '@/env/repos/dataset';
import type { HttpTransport } from '@/env/transport/http';

import { createDeleteDataset } from '@/app/commands/deleteDataset';
import { createDeleteDatasetRows } from '@/app/commands/deleteDatasetRows';
import { createInsertDatasetRow } from '@/app/commands/insertDatasetRow';
import { createPatchDataset } from '@/app/commands/patchDataset';
import { createPatchDatasetColumn } from '@/app/commands/patchDatasetColumn';
import { createUpdateDatasetRows } from '@/app/commands/updateDatasetRows';
import type {
    DatasetRowsPage,
    DatasetScope,
    DeleteDatasetRowsInput,
    GetDatasetRowsInput,
    InsertDatasetRowInput,
    PatchDatasetColumnInput,
    PatchDatasetInput,
    UpdateDatasetRowsInput,
} from '@/app/ports/repos/dataset';
import { createGetDatasetMetadata } from '@/app/queries/getDatasetMetadata';
import { createGetDatasetRows } from '@/app/queries/getDatasetRows';
import { createListDatasets } from '@/app/queries/listDatasets';

export function createDatasetDependencies(cache: CacheRuntime, transport: HttpTransport) {
    const repo = new HttpDatasetRepo(transport);
    const operations = {
        listDatasets: createListDatasets(repo),
        getDatasetMetadata: createGetDatasetMetadata(repo),
        getDatasetRows: createGetDatasetRows(repo),
        deleteDataset: createDeleteDataset(repo),
        patchDataset: createPatchDataset(repo),
        patchDatasetColumn: createPatchDatasetColumn(repo),
        updateDatasetRows: createUpdateDatasetRows(repo),
        insertDatasetRow: createInsertDatasetRow(repo),
        deleteDatasetRows: createDeleteDatasetRows(repo),
    };
    cache.registerRead(operations.listDatasets, datasetListCodec);
    cache.registerRead(operations.getDatasetMetadata, datasetMetadataCodec);
    cache.registerRead<GetDatasetRowsInput, DatasetRowsPage>(
        operations.getDatasetRows,
        datasetRowsCodec,
        {
            normalizeInput: input => ({
                ...input,
                offset: input.offset ?? 0,
                limit: input.limit ?? 200,
            }),
        }
    );
    cache.registerCommand<PatchDatasetInput, void>(operations.patchDataset, {
        conflictKey: input => `orgData:${input.orgId}`,
        affected: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'metadata'
            ),
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand<DatasetScope, void>(operations.deleteDataset, {
        conflictKey: input => `orgData:${input.orgId}`,
        affected: input =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                'removed'
            ),
        codec: valueCodec(),
        removals: input => {
            const address = `${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`;

            return [
                `dataset:${address}` as const,
                ...[...cache.store.keys()].filter(
                    ref =>
                        ref.startsWith(`datasetRow:${address}/`) ||
                        ref.startsWith(`datasetColumn:${address}/`)
                ),
            ];
        },
    });
    cache.registerCommand<PatchDatasetColumnInput, DatasetColumn>(
        operations.patchDatasetColumn,
        {
            conflictKey: input => `orgData:${input.orgId}`,
            affected: input =>
                datasetChanges(
                    `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                    'content'
                ),
            codec: datasetColumnCodec,
            removals: () => [],
        }
    );
    cache.registerCommand<UpdateDatasetRowsInput, DatasetRow[]>(
        operations.updateDatasetRows,
        {
            conflictKey: input => `orgData:${input.orgId}`,
            affected: input =>
                datasetChanges(
                    `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                    'content'
                ),
            codec: datasetRowListCodec,
            removals: () => [],
        }
    );
    cache.registerCommand<InsertDatasetRowInput, DatasetRow>(
        operations.insertDatasetRow,
        {
            conflictKey: input => `orgData:${input.orgId}`,
            affected: input =>
                datasetChanges(
                    `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                    'content'
                ),
            codec: datasetRowCodec,
            removals: () => [],
        }
    );
    cache.registerCommand<DeleteDatasetRowsInput, DatasetRow[]>(
        operations.deleteDatasetRows,
        {
            conflictKey: input => `orgData:${input.orgId}`,
            affected: input =>
                datasetChanges(
                    `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(input.datasetId)}`,
                    'content'
                ),
            codec: valueCodec(),
            removals: (_input, output) => output.map(row => row.ref),
        }
    );

    return operations;
}
