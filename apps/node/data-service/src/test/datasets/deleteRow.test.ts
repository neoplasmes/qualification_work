import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('DELETE /api/datasets/:id/rows/:rowId', () => {
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

        const res = await api(
            `/api/datasets/${datasetId}/rows/${target.id}?orgId=${orgId}`,
            { method: 'DELETE' }
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as { id: string; rowIndex: number };
        expect(body.id).toBe(target.id);
        expect(body.rowIndex).toBe(target.rowIndex);

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

    it('returns 404 for unknown row', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(
            `/api/datasets/${datasetId}/rows/00000000-0000-0000-0000-000000000000?orgId=${orgId}`,
            { method: 'DELETE' }
        );

        expect(res.status).toBe(404);
    });
});
