import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import { parseResponse } from '@/env/tools/responseSchema';
import type { HttpTransport } from '@/env/transport/http';
import { z } from 'zod';

import type {
    DatasetMetadata,
    DatasetRepo,
    DatasetRowsPage,
    DatasetScope,
    DeleteDatasetRowsInput,
    GetDatasetRowsInput,
    InsertDatasetRowInput,
    ListDatasetsInput,
    PatchDatasetColumnInput,
    PatchDatasetInput,
    UpdateDatasetRowsInput,
} from '@/app/ports/repos/dataset';
import type { ReadOptions } from '@/app/ports/repos/readOptions';

import { mapColumn, mapMetadata, mapRow } from './dataset.mapper';
import {
    columnSchema,
    metadataSchema,
    rowSchema,
    rowsPageSchema,
} from './dataset.schema';

export class HttpDatasetRepo implements DatasetRepo {
    constructor(private readonly transport: HttpTransport) {}

    async listDatasets(
        input: ListDatasetsInput,
        options?: ReadOptions
    ): Promise<DatasetMetadata[]> {
        const dto = parseResponse(
            z.array(metadataSchema),
            await this.transport.request({
                path: `/data/datasets?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        return dto.map(item => mapMetadata(item, input));
    }
    async getDatasetMetadata(
        input: DatasetScope,
        options?: ReadOptions
    ): Promise<DatasetMetadata> {
        const dto = parseResponse(
            metadataSchema,
            await this.transport.request({
                path: `/data/datasets/${encodeURIComponent(input.datasetId)}/metadata`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        return mapMetadata(dto, input);
    }
    async getDatasetRows(
        input: GetDatasetRowsInput,
        options?: ReadOptions
    ): Promise<DatasetRowsPage> {
        const { offset = 0, limit = 200 } = input;
        const dto = parseResponse(
            rowsPageSchema,
            await this.transport.request({
                path: `/data/datasets/${encodeURIComponent(input.datasetId)}/rows?offset=${offset}&limit=${limit}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        return { ...dto, rows: dto.rows.map(row => mapRow(row, input)) };
    }
    async deleteDataset(input: DatasetScope): Promise<void> {
        await this.transport.request({
            path: `/data/datasets/${encodeURIComponent(input.datasetId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }
    async patchDataset(input: PatchDatasetInput): Promise<void> {
        await this.transport.request({
            path: `/data/datasets/${encodeURIComponent(input.datasetId)}`,
            method: 'PATCH',
            body: { name: input.name },
            responseType: 'text',
        });
    }
    async patchDatasetColumn(input: PatchDatasetColumnInput): Promise<DatasetColumn> {
        const dto = parseResponse(
            columnSchema,
            await this.transport.request({
                path: `/data/datasets/${encodeURIComponent(input.datasetId)}/columns/${encodeURIComponent(input.columnId)}?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'PATCH',
                body: { isAnalyzable: input.isAnalyzable },
                responseType: 'json',
            })
        );

        return mapColumn(dto, input);
    }
    async updateDatasetRows(input: UpdateDatasetRowsInput): Promise<DatasetRow[]> {
        const dto = parseResponse(
            z.array(rowSchema),
            await this.transport.request({
                path: `/data/datasets/${encodeURIComponent(input.datasetId)}/rows?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'PATCH',
                body: { rowIds: input.rowIds, values: input.values },
                responseType: 'json',
            })
        );

        return dto.map(row => mapRow(row, input));
    }
    async insertDatasetRow(input: InsertDatasetRowInput): Promise<DatasetRow> {
        const dto = parseResponse(
            rowSchema,
            await this.transport.request({
                path: `/data/datasets/${encodeURIComponent(input.datasetId)}/rows?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'POST',
                body: { afterRowId: input.afterRowId, data: input.data },
                responseType: 'json',
            })
        );

        return mapRow(dto, input);
    }
    async deleteDatasetRows(input: DeleteDatasetRowsInput): Promise<DatasetRow[]> {
        const dto = parseResponse(
            z.array(rowSchema),
            await this.transport.request({
                path: `/data/datasets/${encodeURIComponent(input.datasetId)}/rows?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'DELETE',
                body: { rowIds: input.rowIds },
                responseType: 'json',
            })
        );

        return dto.map(row => mapRow(row, input));
    }
}
