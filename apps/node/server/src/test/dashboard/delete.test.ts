import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { mockInternalIdentity } from '@qualification-work/microservice-utils/test';

import { api, apiAs, resetTestIdentity, startServer, stopServer, truncate } from '../lib';
import { bootFixture, createDashboard, dashboardIdentity, silenceErrors } from './lib';

let userId: string;
let orgId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    ({ userId, orgId } = await bootFixture());
    silenceErrors();
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('DELETE /api/dashboards/:id', () => {
    it('204 + dashboard disappears', async () => {
        const dashboardId = await createDashboard(orgId);

        const delRes = await api(`/api/dashboards/${dashboardId}`, {
            method: 'DELETE',
        });
        expect(delRes.status).toBe(204);

        const getRes = await api(`/api/dashboards/${dashboardId}`);
        expect(getRes.status).toBe(404);
    });

    it('404 for non-existent', async () => {
        const res = await api(`/api/dashboards/${randomUUID()}`, {
            method: 'DELETE',
        });
        expect(res.status).toBe(404);
    });

    it('404 for foreign org (SQL filter hides existence)', async () => {
        const dashboardId = await createDashboard(orgId);
        const stranger = mockInternalIdentity({
            orgs: [{ id: randomUUID(), role: 'owner' }],
        });

        const res = await apiAs(stranger, `/api/dashboards/${dashboardId}`, {
            method: 'DELETE',
        });
        expect(res.status).toBe(404);
    });

    it('404 for editor in org and dashboard remains', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}`,
            { method: 'DELETE' }
        );
        expect(res.status).toBe(404);

        const getRes = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}`
        );
        expect(getRes.status).toBe(200);
    });

    it('404 for viewer in org and dashboard remains', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`,
            { method: 'DELETE' }
        );
        expect(res.status).toBe(404);

        const getRes = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`
        );
        expect(getRes.status).toBe(200);
    });
});
