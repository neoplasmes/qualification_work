import { HttpDatasetRepo } from '.';
import { ContractViolationError, HttpTransport } from '@/env/transport/http';
import { describe, expect, it, vi } from 'vitest';

const dataset = {
    id: 'data/1',
    orgId: 'org/1',
    name: 'name',
    sourceType: 'manual',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02',
};
const column = {
    id: 'col/1',
    datasetId: 'data/1',
    key: 'value',
    displayName: 'Value',
    dataType: 'number',
    orderIndex: 0,
    isAnalyzable: true,
};
const row = {
    id: 'row/1',
    datasetId: 'data/1',
    rowIndex: 0,
    data: { nested: { id: 'fake', ref: 'dataset:fake' } },
};
const input = { orgId: 'org/1', datasetId: 'data/1' };

describe('dataset repository', () => {
    it('maps metadata envelopes, stable IDs and explicit row paging', async () => {
        const metadata = { dataset, columns: [column], totalRows: 1 };
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(Response.json([metadata]))
            .mockResolvedValueOnce(Response.json(metadata))
            .mockResolvedValueOnce(
                Response.json({ rows: [row], totalRows: 1, offset: 0, limit: 200 })
            );
        const repo = new HttpDatasetRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        const signal = new AbortController().signal;
        const list = await repo.listDatasets({ orgId: input.orgId }, { signal });
        const detail = await repo.getDatasetMetadata(input, { signal });
        const page = await repo.getDatasetRows(input, { signal });
        expect(list[0]).toEqual(detail);
        expect(detail.dataset).toEqual({ ...dataset, ref: 'dataset:org%2F1/data%2F1' });
        expect(detail.columns[0]).toEqual({
            ...column,
            ref: 'datasetColumn:org%2F1/data%2F1/col%2F1',
        });
        expect(page.rows[0]).toEqual({
            ...row,
            ref: 'datasetRow:org%2F1/data%2F1/row%2F1',
        });
        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            '/api/data/datasets?orgId=org%2F1',
            '/api/data/datasets/data%2F1/metadata',
            '/api/data/datasets/data%2F1/rows?offset=0&limit=200',
        ]);
        expect(fetch.mock.calls.every(([, init]) => init?.signal === signal)).toBe(true);
    });

    it('preserves exact writes, absent anchors, deleted rows and empty responses', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(Response.json(column))
            .mockResolvedValueOnce(Response.json([{ ...row, data: {} }]))
            .mockResolvedValueOnce(Response.json(row))
            .mockResolvedValueOnce(Response.json(row))
            .mockResolvedValueOnce(Response.json([row]));
        const repo = new HttpDatasetRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        await expect(
            repo.patchDataset({ ...input, name: 'renamed' })
        ).resolves.toBeUndefined();
        await expect(repo.deleteDataset(input)).resolves.toBeUndefined();
        await expect(
            repo.patchDatasetColumn({
                ...input,
                columnId: column.id,
                isAnalyzable: false,
            })
        ).resolves.toMatchObject({ id: column.id });
        await expect(
            repo.updateDatasetRows({
                ...input,
                rowIds: [row.id],
                values: { value: null },
            })
        ).resolves.toMatchObject([{ data: {} }]);
        await repo.insertDatasetRow({ ...input, data: {} });
        await repo.insertDatasetRow({ ...input, data: { value: 1 }, afterRowId: row.id });
        await expect(
            repo.deleteDatasetRows({ ...input, rowIds: [row.id] })
        ).resolves.toMatchObject([{ id: row.id }]);
        expect(
            fetch.mock.calls.map(([url, init]) => [url, init?.method, init?.body])
        ).toEqual([
            ['/api/data/datasets/data%2F1', 'PATCH', '{"name":"renamed"}'],
            ['/api/data/datasets/data%2F1', 'DELETE', undefined],
            [
                '/api/data/datasets/data%2F1/columns/col%2F1?orgId=org%2F1',
                'PATCH',
                '{"isAnalyzable":false}',
            ],
            [
                '/api/data/datasets/data%2F1/rows?orgId=org%2F1',
                'PATCH',
                '{"rowIds":["row/1"],"values":{"value":null}}',
            ],
            ['/api/data/datasets/data%2F1/rows?orgId=org%2F1', 'POST', '{"data":{}}'],
            [
                '/api/data/datasets/data%2F1/rows?orgId=org%2F1',
                'POST',
                '{"afterRowId":"row/1","data":{"value":1}}',
            ],
            [
                '/api/data/datasets/data%2F1/rows?orgId=org%2F1',
                'DELETE',
                '{"rowIds":["row/1"]}',
            ],
        ]);
    });

    it('rejects incomplete and incorrectly scoped metadata DTOs', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(
                Response.json({ dataset, columns: [{}], totalRows: 0 })
            )
            .mockResolvedValueOnce(
                Response.json({
                    dataset: { ...dataset, orgId: 'other' },
                    columns: [],
                    totalRows: 0,
                })
            );
        const repo = new HttpDatasetRepo(new HttpTransport({ baseUrl: '/api', fetch }));
        await expect(repo.getDatasetMetadata(input)).rejects.toBeInstanceOf(
            ContractViolationError
        );
        await expect(repo.getDatasetMetadata(input)).rejects.toBeInstanceOf(
            ContractViolationError
        );
    });
});
