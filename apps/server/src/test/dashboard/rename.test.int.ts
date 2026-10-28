import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { mockInternalIdentity } from '@qualification-work/microservice-utils/test-utils';
import type { Dashboard } from '@qualification-work/types';

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

describe('PATCH /api/dashboards/:id', () => {
    it('renames + 204', async () => {
        const dashboardId = await createDashboard(orgId, 'Old');

        const patchRes = await api(`/api/dashboards/${dashboardId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'New' }),
        });
        expect(patchRes.status).toBe(204);

        const getRes = await api(`/api/dashboards/${dashboardId}`);
        const body = (await getRes.json()) as Dashboard;
        expect(body.name).toBe('New');
    });

    it('404 for non-existent id', async () => {
        const res = await api(`/api/dashboards/${randomUUID()}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'New' }),
        });
        expect(res.status).toBe(404);
    });

    it('404 for foreign org (SQL filter hides existence)', async () => {
        const dashboardId = await createDashboard(orgId);
        const stranger = mockInternalIdentity({
            orgs: [{ id: randomUUID(), role: 'owner' }],
        });

        const res = await apiAs(stranger, `/api/dashboards/${dashboardId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'hacked' }),
        });
        expect(res.status).toBe(404);
    });

    it('204 for editor in org', async () => {
        const dashboardId = await createDashboard(orgId, 'Old');

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Editor name' }),
            }
        );
        expect(res.status).toBe(204);

        const getRes = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}`
        );
        const body = (await getRes.json()) as Dashboard;
        expect(body.name).toBe('Editor name');
    });

    it('404 for viewer in org and name remains', async () => {
        const dashboardId = await createDashboard(orgId, 'Original');

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Viewer name' }),
            }
        );
        expect(res.status).toBe(404);

        const getRes = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`
        );
        const body = (await getRes.json()) as Dashboard;
        expect(body.name).toBe('Original');
    });

    it('400 on empty name', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: '   ' }),
        });
        expect(res.status).toBe(400);
    });
});
