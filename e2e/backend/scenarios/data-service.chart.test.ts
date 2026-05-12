import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';

console.log(`running ${import.meta.filename}`);
const setupOrgAndDataset = async (cookie: string, userId: string) => {
    const orgResponse = await api('/api/orgs', {
        method: 'POST',
        cookie,
        body: JSON.stringify({ name: `e2e-chart-${Date.now()}`, ownerId: userId }),
    });
    expect(orgResponse.status).toBe(201);
    const { id: orgId } = (await orgResponse.json()) as { id: string };

    const csv = 'category,value\nA,10\nB,20\nC,30';
    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'data.csv');

    const datasetResponse = await api(`/api/data/datasets?orgId=${orgId}`, {
        method: 'POST',
        cookie,
        body: form,
    });
    expect(datasetResponse.status).toBe(201);
    const { id: datasetId } = (await datasetResponse.json()) as { id: string };

    return { orgId, datasetId };
};

describe('data-service /api/data/charts via gateway', () => {
    it('create chart -> 201 with id', async () => {
        const user = await registerAndLogin();
        const me = (await (
            await api('/api/auth/me', { cookie: user.cookie })
        ).json()) as {
            id: string;
        };

        const { orgId, datasetId } = await setupOrgAndDataset(user.cookie, me.id);

        const response = await api('/api/data/charts', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                orgId,
                datasetId,
                name: 'e2e bar chart',
                chartType: 'bar',
                config: { kind: 'bar', xColumn: 'category', yColumn: 'value' },
            }),
        });

        expect(response.status).toBe(201);
        const body = (await response.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('list charts for org -> 200 (not 401/403)', async () => {
        const user = await registerAndLogin();
        const me = (await (
            await api('/api/auth/me', { cookie: user.cookie })
        ).json()) as {
            id: string;
        };

        const { orgId } = await setupOrgAndDataset(user.cookie, me.id);

        const response = await api(`/api/data/charts?orgId=${orgId}`, {
            cookie: user.cookie,
        });

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });
});
