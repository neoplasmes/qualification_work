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

describe('PATCH /api/datasets/:id/rows', () => {
    it('partially updates a row by jsonb merge', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const [row] = await dbQuery<{ id: string; data: Record<string, unknown> }>(
            `SELECT id, data FROM data.dataset_rows
             WHERE dataset_id = $1 ORDER BY row_index LIMIT 1`,
            [datasetId]
        );

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'PATCH',
            body: JSON.stringify({ rowIds: [row.id], values: { name: 'NEW' } }),
        });

        expect(res.status).toBe(200);
        const [body] = (await res.json()) as { data: Record<string, unknown> }[];
        expect(body.data.name).toBe('NEW');
        // other fields kept intact
        expect(body.data.age).toBe(row.data.age);
        expect(body.data.city).toBe(row.data.city);
    });

    it('applies the same values to every selected row', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const rows = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_rows
             WHERE dataset_id = $1 ORDER BY row_index LIMIT 2`,
            [datasetId]
        );
        const rowIds = rows.map(row => row.id);

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'PATCH',
            body: JSON.stringify({ rowIds, values: { name: 'SHARED' } }),
        });

        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            id: string;
            data: Record<string, unknown>;
        }[];
        expect(body).toHaveLength(2);
        expect(body.every(row => row.data.name === 'SHARED')).toBe(true);
    });

    it('removes a jsonb key when a cell is cleared', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const [row] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_rows
             WHERE dataset_id = $1 ORDER BY row_index LIMIT 1`,
            [datasetId]
        );

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'PATCH',
            body: JSON.stringify({ rowIds: [row.id], values: { name: '' } }),
        });

        expect(res.status).toBe(200);
        const [body] = (await res.json()) as { data: Record<string, unknown> }[];
        expect('name' in body.data).toBe(false);

        const [stored] = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows WHERE id = $1`,
            [row.id]
        );
        expect('name' in stored.data).toBe(false);
    });

    it('rejects unknown column key', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const [row] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_rows WHERE dataset_id = $1 LIMIT 1`,
            [datasetId]
        );

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                rowIds: [row.id],
                values: { definitelyNotAColumn: 1 },
            }),
        });

        expect(res.status).toBe(400);
    });

    it('rejects wrong type for column', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const [row] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_rows WHERE dataset_id = $1 LIMIT 1`,
            [datasetId]
        );

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${orgId}`, {
            method: 'PATCH',
            body: JSON.stringify({ rowIds: [row.id], values: { age: 'not-a-number' } }),
        });

        expect(res.status).toBe(400);
    });

    it('returns 403 for cross-org access', async () => {
        const { orgId: ownerOrg } = await createTestUserWithOrg();
        const { orgId: outsiderOrg } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(ownerOrg);

        const [row] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_rows WHERE dataset_id = $1 LIMIT 1`,
            [datasetId]
        );

        const res = await api(`/api/datasets/${datasetId}/rows?orgId=${outsiderOrg}`, {
            method: 'PATCH',
            body: JSON.stringify({ rowIds: [row.id], values: { name: 'x' } }),
        });

        expect(res.status).toBe(403);
    });
});
