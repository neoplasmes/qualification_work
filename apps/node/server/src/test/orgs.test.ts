import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { api, createTestUser, startServer, stopServer, truncate } from './setup';

let userId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
});

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(truncate);

describe('POST /api/orgs', () => {
    it('successful creation + 201 + id', async () => {
        const res = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'newOrganization', ownerId: userId }),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('invalid data returns 400', async () => {
        const res = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: '', ownerId: 'not-a-uuid' }),
        });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/orgs/:id', () => {
    it('successful deletion returns 204', async () => {
        const createRes = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'Deletable Organization', ownerId: userId }),
        });
        const { id } = (await createRes.json()) as { id: string };

        const res = await api(`/api/orgs/${id}`, {
            method: 'DELETE',
        });

        expect(res.status).toBe(204);
    });

    it('deleting non-existent organization returns 404', async () => {
        const res = await api('/api/orgs/00000000-0000-0000-0000-000000000000', {
            method: 'DELETE',
        });

        expect(res.status).toBe(404);
    });
});
