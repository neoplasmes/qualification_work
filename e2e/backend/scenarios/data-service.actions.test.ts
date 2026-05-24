import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

const setupDataset = async (cookie: string, orgId: string) => {
    const csv = 'id,name,age,active,city\n1,Alice,30,true,Paris\n2,Bob,25,false,Berlin';
    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'customers.csv');

    const datasetResponse = await api(`/api/data/datasets?orgId=${orgId}`, {
        method: 'POST',
        cookie,
        body: form,
    });
    expect(datasetResponse.status).toBe(201);
    const { id: datasetId } = (await datasetResponse.json()) as { id: string };

    return { datasetId };
};

describe('data-service /api/data/actions via gateway', () => {
    it('creates, patches, executes and lists action runs', async () => {
        const user = await registerAndLogin();
        const orgId = user.orgId;
        const { datasetId } = await setupDataset(user.cookie, orgId);

        const createResponse = await api('/api/data/actions', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                orgId,
                name: 'Register customer',
                description: 'Adds a customer row',
                parameters: [
                    { key: 'id', label: 'ID', type: 'string', required: true },
                    { key: 'name', label: 'Name', type: 'string', required: true },
                    { key: 'age', label: 'Age', type: 'string', required: true },
                ],
                effects: [
                    {
                        kind: 'insertRow',
                        datasetId,
                        values: {
                            id: { kind: 'parameter', key: 'id' },
                            name: { kind: 'parameter', key: 'name' },
                            age: { kind: 'parameter', key: 'age' },
                            active: { kind: 'literal', value: 'true' },
                            city: { kind: 'literal', value: 'Rome' },
                        },
                    },
                ],
            }),
        });
        expect(createResponse.status).toBe(201);
        const { id: actionId } = (await createResponse.json()) as { id: string };

        const patchResponse = await api(`/api/data/actions/${actionId}`, {
            method: 'PATCH',
            cookie: user.cookie,
            body: JSON.stringify({ description: 'Patched through backend e2e' }),
        });
        expect(patchResponse.status).toBe(204);

        const getResponse = await api(`/api/data/actions/${actionId}`, {
            cookie: user.cookie,
        });
        expect(getResponse.status).toBe(200);
        const action = (await getResponse.json()) as { description: string };
        expect(action.description).toBe('Patched through backend e2e');

        const executeResponse = await api(`/api/data/actions/${actionId}/runs`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                parameters: { id: '3', name: 'Carla', age: '28' },
            }),
        });
        expect(executeResponse.status).toBe(201);
        const run = (await executeResponse.json()) as {
            actionId: string;
            status: string;
            changes: Array<{ kind: string }>;
        };
        expect(run).toMatchObject({ actionId, status: 'success' });
        expect(run.changes).toEqual([expect.objectContaining({ kind: 'insertRow' })]);

        const rowsResponse = await api(
            `/api/data/datasets/${datasetId}/rows?offset=0&limit=10`,
            { cookie: user.cookie }
        );
        expect(rowsResponse.status).toBe(200);
        const rowsPage = (await rowsResponse.json()) as {
            rows: Array<{ data: Record<string, unknown> }>;
        };
        expect(rowsPage.rows.some(row => row.data.name === 'Carla')).toBe(true);

        const runsResponse = await api(`/api/data/actions/runs?orgId=${orgId}`, {
            cookie: user.cookie,
        });
        expect(runsResponse.status).toBe(200);
        const runs = (await runsResponse.json()) as Array<{
            actionId: string;
            status: string;
        }>;
        expect(runs[0]).toMatchObject({ actionId, status: 'success' });
    });
});
