import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    api,
    startServer,
    stopServer,
    truncate,
    waitForRedisKeys,
    waitForRedisVersion,
} from './setup';

const user = {
    email: 'orgs@example.com',
    password: 'password123',
    name: 'Jonh',
    family: 'Doe',
};

let userId: string;
let cookie: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    await truncate();

    const regRes = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(user),
    });
    const regBody = (await regRes.json()) as { id: string };
    userId = regBody.id;

    const loginRes = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, password: user.password }),
    });
    cookie = loginRes.headers.get('set-cookie')!;
});

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/orgs', () => {
    it('successful creation + 201 + id', async () => {
        const res = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'newOrganization', ownerId: userId }),
            headers: { cookie },
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('invalid data returns 400', async () => {
        const res = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: '', ownerId: 'not-a-uuid' }),
            headers: { cookie },
        });

        expect(res.status).toBe(400);
    });

    it('bumps /me cache version after organization creation', async () => {
        const meBefore = await api('/api/auth/me', { headers: { cookie } });
        const meBeforeBody = (await meBefore.json()) as {
            id: string;
            organizations: unknown[];
        };

        const v0Keys = await waitForRedisKeys(`me:user:${meBeforeBody.id}:version:*:data`);
        expect(v0Keys).toHaveLength(1);

        const createRes = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'Second Org', ownerId: userId }),
            headers: { cookie },
        });
        expect(createRes.status).toBe(201);

        // wait for FAF cache invalidation before requesting /me
        await waitForRedisVersion(`me:user:${meBeforeBody.id}:version`, 1);

        const meAfter = await api('/api/auth/me', { headers: { cookie } });
        const meAfterBody = (await meAfter.json()) as {
            id: string;
            organizations: unknown[];
        };

        const v1Keys = await waitForRedisKeys(`me:user:${meAfterBody.id}:version:1:data`);
        expect(v1Keys).toHaveLength(1);
        expect(meAfterBody.organizations.length).toBeGreaterThan(
            meBeforeBody.organizations.length
        );
    });
});

describe('DELETE /api/orgs/:id', () => {
    it('successful deletion returns 204', async () => {
        const createRes = await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'Deletable Organization', ownerId: userId }),
            headers: { cookie },
        });
        const { id } = (await createRes.json()) as { id: string };

        const res = await api(`/api/orgs/${id}`, {
            method: 'DELETE',
            headers: { cookie },
        });

        expect(res.status).toBe(204);
    });

    it('deleting non-existent organization returns 404', async () => {
        const res = await api('/api/orgs/00000000-0000-0000-0000-000000000000', {
            method: 'DELETE',
            headers: { cookie },
        });

        expect(res.status).toBe(404);
    });
});
