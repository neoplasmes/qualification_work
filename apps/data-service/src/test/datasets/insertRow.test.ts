import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { uploadDataset } from './lib';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('POST /api/datasets/:id/rows', () => {
    it('appends a row at next row_index', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const [{ maxIndex }] = await dbQuery<{ maxIndex: number }>(
            `SELECT MAX(row_index) AS "maxIndex" FROM data.dataset_rows WHERE dataset_id = $1`,
            [datasetId]
        );

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'POST',
            body: JSON.stringify({
                data: { id: 999, name: 'Zed', age: 99, city: 'X' },
            }),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as {
            rowIndex: number;
            data: Record<string, unknown>;
        };
        expect(body.rowIndex).toBe(maxIndex + 1);
        expect(body.data.name).toBe('Zed');
    });

    it('rejects unknown column on insert', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'POST',
            body: JSON.stringify({ data: { mystery: 1 } }),
        });

        expect(res.status).toBe(400);
    });

    it('drops null/empty fields when storing', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'POST',
            body: JSON.stringify({ data: { id: 500, name: 'OnlyName', age: '' } }),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as { data: Record<string, unknown> };
        expect(body.data.name).toBe('OnlyName');
        expect('age' in body.data).toBe(false);
    });

    it('inserts a row below target row and shifts following row indexes', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const rowsBefore = await dbQuery<{ id: string; rowIndex: number }>(
            `SELECT id, row_index AS "rowIndex"
             FROM data.dataset_rows
             WHERE dataset_id = $1
             ORDER BY row_index
             LIMIT 4`,
            [datasetId]
        );
        const target = rowsBefore[1];

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'POST',
            body: JSON.stringify({
                afterRowId: target.id,
                data: { id: 777, name: 'Inserted', age: 33 },
            }),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as {
            id: string;
            rowIndex: number;
            data: Record<string, unknown>;
        };
        expect(body.rowIndex).toBe(target.rowIndex + 1);
        expect(body.data.name).toBe('Inserted');

        const rowsAfter = await dbQuery<{ id: string; rowIndex: number }>(
            `SELECT id, row_index AS "rowIndex"
             FROM data.dataset_rows
             WHERE dataset_id = $1
             ORDER BY row_index
             LIMIT 5`,
            [datasetId]
        );
        expect(rowsAfter.map(row => row.rowIndex)).toEqual([0, 1, 2, 3, 4]);
        expect(rowsAfter[2].id).toBe(body.id);
        expect(rowsAfter[3].id).toBe(rowsBefore[2].id);
    });

    it('returns 404 when inserting below unknown row', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'POST',
            body: JSON.stringify({
                afterRowId: '00000000-0000-0000-0000-000000000000',
                data: { id: 777, name: 'Inserted', age: 33 },
            }),
        });

        expect(res.status).toBe(404);
    });
});
