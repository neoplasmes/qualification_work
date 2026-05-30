import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { uploadDataset } from '../datasets/lib';
import {
    api,
    createTestUserWithOrg,
    dbQuery,
    resetTestIdentity,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { buildInsertAction, buildUpdateAction, createAction, setIdentity } from './lib';

beforeAll(startServer);
afterAll(stopServer);
afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('action execution', () => {
    it('executes insertRow and records a successful run', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);
        const actionId = await createAction(buildInsertAction(orgId, datasetId));

        const res = await api(`/api/actions/${actionId}/runs`, {
            method: 'POST',
            body: JSON.stringify({
                parameters: { id: 777, name: 'Mira Stone', age: '34' },
            }),
        });

        expect(res.status).toBe(201);
        const run = (await res.json()) as {
            status: string;
            userId: string;
            changes: Array<{ kind: string; data: Record<string, unknown> }>;
        };
        expect(run.status).toBe('success');
        expect(run.userId).toBe(userId);
        expect(run.changes[0]).toMatchObject({
            kind: 'insertRow',
            data: { id: 777, name: 'Mira Stone', age: 34, active: true, city: 'Paris' },
        });

        const [row] = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows
             WHERE dataset_id = $1 AND data ->> 'name' = 'Mira Stone'`,
            [datasetId]
        );
        expect(row.data).toMatchObject({ id: 777, age: 34 });

        const runsRes = await api(`/api/actions/runs?orgId=${orgId}`);
        const runs = (await runsRes.json()) as Array<{ id: string; status: string }>;
        expect(runs).toHaveLength(1);
        expect(runs[0].status).toBe('success');
    });

    it('executes updateRowsByMatch and records before/after changes', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);
        const actionId = await createAction(buildUpdateAction(orgId, datasetId));

        const res = await api(`/api/actions/${actionId}/runs`, {
            method: 'POST',
            body: JSON.stringify({ parameters: { id: '1', name: 'Alice Updated' } }),
        });

        expect(res.status).toBe(201);
        const run = (await res.json()) as {
            changes: Array<{
                kind: string;
                before: Array<{ data: Record<string, unknown> }>;
                after: Array<{ data: Record<string, unknown> }>;
            }>;
        };
        expect(run.changes[0].kind).toBe('updateRowsByMatch');
        expect(run.changes[0].before[0].data.name).toBe('Alice Johnson');
        expect(run.changes[0].after[0].data.name).toBe('Alice Updated');

        const [row] = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows
             WHERE dataset_id = $1 AND data ->> 'id' = '1'`,
            [datasetId]
        );
        expect(row.data.name).toBe('Alice Updated');
    });

    it('records failed run when a required parameter is missing', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);
        const actionId = await createAction(buildInsertAction(orgId, datasetId));

        const res = await api(`/api/actions/${actionId}/runs`, {
            method: 'POST',
            body: JSON.stringify({ parameters: { id: 778, age: 20 } }),
        });

        expect(res.status).toBe(400);

        const runsRes = await api(`/api/actions/${actionId}/runs?orgId=${orgId}`);
        const runs = (await runsRes.json()) as Array<{
            status: string;
            errorMessage: string;
        }>;
        expect(runs).toHaveLength(1);
        expect(runs[0].status).toBe('failed');
        expect(runs[0].errorMessage).toContain('missing required parameter');
    });

    it('records failed run when update matches no rows', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);
        const actionId = await createAction(buildUpdateAction(orgId, datasetId));

        const res = await api(`/api/actions/${actionId}/runs`, {
            method: 'POST',
            body: JSON.stringify({ parameters: { id: '999999', name: 'Nobody' } }),
        });

        expect(res.status).toBe(404);

        const runs = (await (
            await api(`/api/actions/runs?orgId=${orgId}`)
        ).json()) as Array<{ status: string; errorMessage: string }>;
        expect(runs[0].status).toBe('failed');
        expect(runs[0].errorMessage).toContain('No rows matched');
    });

    it('rolls back and records failed run when update exceeds maxRows', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        setIdentity(userId, orgId);
        const datasetId = await uploadDataset(orgId);

        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
             VALUES ($1, 9999, '{"id": "1", "name": "Duplicate", "age": "50"}'::jsonb)`,
            [datasetId]
        );

        const actionId = await createAction(buildUpdateAction(orgId, datasetId, 1));

        const res = await api(`/api/actions/${actionId}/runs`, {
            method: 'POST',
            body: JSON.stringify({ parameters: { id: '1', name: 'Should Roll Back' } }),
        });

        expect(res.status).toBe(409);

        const rows = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows
             WHERE dataset_id = $1 AND data ->> 'id' = '1'
             ORDER BY row_index`,
            [datasetId]
        );
        expect(rows.map(row => row.data.name)).toEqual(['Alice Johnson', 'Duplicate']);

        const runs = (await (
            await api(`/api/actions/runs?orgId=${orgId}`)
        ).json()) as Array<{ status: string; changes: unknown[] }>;
        expect(runs[0]).toMatchObject({ status: 'failed', changes: [] });
    });

    it('rejects actions that reference datasets from another organization', async () => {
        const { userId, orgId } = await createTestUserWithOrg();
        const { userId: otherUserId, orgId: otherOrgId } = await createTestUserWithOrg();
        setIdentity(otherUserId, otherOrgId);
        const otherDatasetId = await uploadDataset(otherOrgId);

        setIdentity(userId, orgId);
        const res = await api('/api/actions', {
            method: 'POST',
            body: JSON.stringify(buildInsertAction(orgId, otherDatasetId)),
        });

        expect(res.status).toBe(403);
    });
});
