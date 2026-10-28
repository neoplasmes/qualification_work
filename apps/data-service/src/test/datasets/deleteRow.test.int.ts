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

describe('DELETE /api/datasets/:id/rows', () => {
    it('deletes a row and compacts following row indexes', async () => {
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
            method: 'DELETE',
            body: JSON.stringify({ rowIds: [target.id] }),
        });

        expect(res.status).toBe(200);
        const body = (await res.json()) as { id: string; rowIndex: number }[];
        expect(body[0].id).toBe(target.id);
        expect(body[0].rowIndex).toBe(target.rowIndex);

        const rowsAfter = await dbQuery<{ id: string; rowIndex: number }>(
            `SELECT id, row_index AS "rowIndex"
             FROM data.dataset_rows
             WHERE dataset_id = $1
             ORDER BY row_index
             LIMIT 4`,
            [datasetId]
        );
        expect(rowsAfter.map(row => row.rowIndex)).toEqual([0, 1, 2, 3]);
        expect(rowsAfter[1].id).toBe(rowsBefore[2].id);
    });

    it('deletes many rows at once and keeps indexes dense', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const rowsBefore = await dbQuery<{ id: string; rowIndex: number }>(
            `SELECT id, row_index AS "rowIndex"
             FROM data.dataset_rows
             WHERE dataset_id = $1
             ORDER BY row_index
             LIMIT 5`,
            [datasetId]
        );
        // delete two non-adjacent rows
        const targets = [rowsBefore[1].id, rowsBefore[3].id];

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'DELETE',
            body: JSON.stringify({ rowIds: targets }),
        });

        expect(res.status).toBe(200);
        const body = (await res.json()) as { id: string }[];
        expect(body.map(row => row.id).sort()).toEqual([...targets].sort());

        const [{ count }] = await dbQuery<{ count: string }>(
            `SELECT COUNT(*)::int AS count FROM data.dataset_rows WHERE dataset_id = $1`,
            [datasetId]
        );
        const remaining = await dbQuery<{ rowIndex: number }>(
            `SELECT row_index AS "rowIndex"
             FROM data.dataset_rows
             WHERE dataset_id = $1
             ORDER BY row_index`,
            [datasetId]
        );
        expect(remaining.map(row => row.rowIndex)).toEqual(
            Array.from({ length: Number(count) }, (_, i) => i)
        );
    });

    it('returns 404 when no row matches', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'DELETE',
            body: JSON.stringify({
                rowIds: ['00000000-0000-0000-0000-000000000000'],
            }),
        });

        expect(res.status).toBe(404);
    });
});
