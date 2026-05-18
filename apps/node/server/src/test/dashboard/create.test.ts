import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { mockInternalIdentity } from '@qualification-work/microservice-utils/test';

import { api, apiAs, resetTestIdentity, startServer, stopServer, truncate } from '../lib';
import { bootFixture, dashboardIdentity, silenceErrors } from './lib';

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

describe('POST /api/dashboards', () => {
    it('201 + id', async () => {
        const res = await api('/api/dashboards', {
            method: 'POST',
            body: JSON.stringify({ orgId, name: 'My dashboard' }),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('404 when org does not exist', async () => {
        const fakeOrgId = randomUUID();
        const stranger = mockInternalIdentity({
            orgs: [{ id: fakeOrgId, role: 'owner' }],
        });

        const res = await apiAs(stranger, '/api/dashboards', {
            method: 'POST',
            body: JSON.stringify({ orgId: fakeOrgId, name: 'x' }),
        });

        expect(res.status).toBe(404);
    });

    it('403 when orgId is not in membership', async () => {
        const stranger = mockInternalIdentity({
            orgs: [{ id: randomUUID(), role: 'owner' }],
        });

        const res = await apiAs(stranger, '/api/dashboards', {
            method: 'POST',
            body: JSON.stringify({ orgId, name: 'x' }),
        });

        expect(res.status).toBe(403);
    });

    it('403 for viewer in org', async () => {
        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            '/api/dashboards',
            {
                method: 'POST',
                body: JSON.stringify({ orgId, name: 'x' }),
            }
        );

        expect(res.status).toBe(403);
    });

    it('201 for editor in org', async () => {
        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            '/api/dashboards',
            {
                method: 'POST',
                body: JSON.stringify({ orgId, name: 'Editor dashboard' }),
            }
        );

        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('400 on empty name', async () => {
        const res = await api('/api/dashboards', {
            method: 'POST',
            body: JSON.stringify({ orgId, name: '' }),
        });

        expect(res.status).toBe(400);
    });
});
