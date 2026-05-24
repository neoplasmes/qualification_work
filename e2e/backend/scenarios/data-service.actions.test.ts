import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';
import { createInsertRowAction, uploadCsvDataset } from '../utils/factories.js';

type RowsPage = { rows: Array<{ data: Record<string, unknown> }> };
type ActionRun = {
    id: string;
    actionId: string;
    status: 'success' | 'failed';
    parameters: Record<string, unknown>;
    changes: Array<{ kind: string }>;
    errorMessage?: string | null;
};

describe('data-service /api/data/actions', () => {
    it('create insertRow action -> 201', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name,age\n1,Alice,30',
        });

        const { id } = await createInsertRowAction(user, dataset, {
            parameters: [
                { key: 'id', type: 'string' },
                { key: 'name', type: 'string' },
                { key: 'age', type: 'string' },
            ],
            values: {
                id: { kind: 'parameter', key: 'id' },
                name: { kind: 'parameter', key: 'name' },
                age: { kind: 'parameter', key: 'age' },
            },
        });
        expect(id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('execute insertRow action -> adds a row, run is recorded', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name,age\n1,Alice,30',
        });
        const { id: actionId } = await createInsertRowAction(user, dataset, {
            parameters: [
                { key: 'id', type: 'string' },
                { key: 'name', type: 'string' },
                { key: 'age', type: 'string' },
            ],
            values: {
                id: { kind: 'parameter', key: 'id' },
                name: { kind: 'parameter', key: 'name' },
                age: { kind: 'parameter', key: 'age' },
            },
        });

        const execute = await api(`/api/data/actions/${actionId}/runs`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                parameters: { id: '2', name: 'Bob', age: '25' },
            }),
        });
        expect(execute.status).toBe(201);
        const run = (await execute.json()) as ActionRun;
        expect(run).toMatchObject({ actionId, status: 'success' });
        expect(run.changes[0].kind).toBe('insertRow');

        const rows = await api(`/api/data/datasets/${dataset.id}/rows?offset=0&limit=10`, {
            cookie: user.cookie,
        });
        const body = (await rows.json()) as RowsPage;
        expect(body.rows.some(r => r.data.name === 'Bob')).toBe(true);
    });

    it('execute updateRowsByMatch action -> updates the matching row', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name,age\n1,Alice,30\n2,Bob,25',
        });

        const create = await api('/api/data/actions', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                orgId: user.orgId,
                name: 'update age',
                parameters: [
                    { key: 'targetId', label: 'targetId', type: 'string', required: true },
                    { key: 'newAge', label: 'newAge', type: 'string', required: true },
                ],
                effects: [
                    {
                        kind: 'updateRowsByMatch',
                        datasetId: dataset.id,
                        match: { columnKey: 'id', parameterKey: 'targetId' },
                        values: {
                            age: { kind: 'parameter', key: 'newAge' },
                        },
                    },
                ],
            }),
        });
        expect(create.status).toBe(201);
        const { id: actionId } = (await create.json()) as { id: string };

        const execute = await api(`/api/data/actions/${actionId}/runs`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ parameters: { targetId: '1', newAge: '31' } }),
        });
        expect(execute.status).toBe(201);
        const run = (await execute.json()) as ActionRun;
        expect(run.status).toBe('success');

        const rows = await api(`/api/data/datasets/${dataset.id}/rows`, {
            cookie: user.cookie,
        });
        const body = (await rows.json()) as RowsPage;
        const alice = body.rows.find(r => r.data.name === 'Alice');
        expect(alice?.data.age).toBe(31);
    });

    it('failed execution (missing required parameter) -> run recorded as failed', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name\n1,Alice',
        });
        const { id: actionId } = await createInsertRowAction(user, dataset, {
            parameters: [
                { key: 'id', type: 'string' },
                { key: 'name', type: 'string' },
            ],
            values: {
                id: { kind: 'parameter', key: 'id' },
                name: { kind: 'parameter', key: 'name' },
            },
        });

        const execute = await api(`/api/data/actions/${actionId}/runs`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ parameters: { id: '2' } }), // missing 'name'
        });
        expect(execute.status).toBeGreaterThanOrEqual(400);

        const runs = await api(
            `/api/data/actions/${actionId}/runs?orgId=${user.orgId}`,
            { cookie: user.cookie }
        );
        expect(runs.status).toBe(200);
        const list = (await runs.json()) as ActionRun[];
        expect(list.some(r => r.status === 'failed')).toBe(true);
    });

    it('patch action -> 204, get reflects the change', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, { csv: 'a\n1' });
        const { id: actionId } = await createInsertRowAction(user, dataset, {
            parameters: [{ key: 'a', type: 'string' }],
            values: { a: { kind: 'parameter', key: 'a' } },
        });

        const patch = await api(`/api/data/actions/${actionId}`, {
            method: 'PATCH',
            cookie: user.cookie,
            body: JSON.stringify({ description: 'patched description' }),
        });
        expect(patch.status).toBe(204);

        const get = await api(`/api/data/actions/${actionId}`, {
            cookie: user.cookie,
        });
        const action = (await get.json()) as { description: string };
        expect(action.description).toBe('patched description');
    });

    it('archive action -> 204, no longer in list', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, { csv: 'a\n1' });
        const { id: actionId } = await createInsertRowAction(user, dataset, {
            parameters: [{ key: 'a', type: 'string' }],
            values: { a: { kind: 'parameter', key: 'a' } },
        });

        const archive = await api(`/api/data/actions/${actionId}`, {
            method: 'DELETE',
            cookie: user.cookie,
        });
        expect(archive.status).toBe(204);

        const list = await api(`/api/data/actions?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        const items = (await list.json()) as Array<{ id: string }>;
        expect(items.some(a => a.id === actionId)).toBe(false);
    });

    it('org-level run history aggregates runs from all actions', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, { csv: 'id,name\n1,Alice' });
        const { id: actionId } = await createInsertRowAction(user, dataset, {
            parameters: [
                { key: 'id', type: 'string' },
                { key: 'name', type: 'string' },
            ],
            values: {
                id: { kind: 'parameter', key: 'id' },
                name: { kind: 'parameter', key: 'name' },
            },
        });

        await api(`/api/data/actions/${actionId}/runs`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ parameters: { id: '2', name: 'Bob' } }),
        });

        const runs = await api(`/api/data/actions/runs?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        expect(runs.status).toBe(200);
        const list = (await runs.json()) as ActionRun[];
        expect(list.some(r => r.actionId === actionId)).toBe(true);
    });

    it('execute action from another org -> 403/404', async () => {
        const owner = await registerAndLogin();
        const stranger = await registerAndLogin();
        const dataset = await uploadCsvDataset(owner, { csv: 'id,name\n1,Alice' });
        const { id: actionId } = await createInsertRowAction(owner, dataset, {
            parameters: [
                { key: 'id', type: 'string' },
                { key: 'name', type: 'string' },
            ],
            values: {
                id: { kind: 'parameter', key: 'id' },
                name: { kind: 'parameter', key: 'name' },
            },
        });

        const response = await api(`/api/data/actions/${actionId}/runs`, {
            method: 'POST',
            cookie: stranger.cookie,
            body: JSON.stringify({ parameters: { id: '99', name: 'Mallory' } }),
        });
        expect([403, 404]).toContain(response.status);
    });
});
