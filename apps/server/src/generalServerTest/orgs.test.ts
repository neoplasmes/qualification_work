import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { api, startServer, stopServer, truncate } from './setup';

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

describe('POST /api/orgs/create', () => {
    it('successful creation + 201 + id', async () => {
        const res = await api('/api/orgs/create', {
            method: 'POST',
            body: JSON.stringify({ name: 'Новая организация', ownerId: userId }),
            headers: { cookie },
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('invalid data returns 400', async () => {
        const res = await api('/api/orgs/create', {
            method: 'POST',
            body: JSON.stringify({ name: '', ownerId: 'not-a-uuid' }),
            headers: { cookie },
        });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/orgs/delete', () => {
    it('successful deletion returns 204', async () => {
        const createRes = await api('/api/orgs/create', {
            method: 'POST',
            body: JSON.stringify({ name: 'Deletable Organization', ownerId: userId }),
            headers: { cookie },
        });
        const { id } = (await createRes.json()) as { id: string };

        const res = await api('/api/orgs/delete', {
            method: 'POST',
            body: JSON.stringify({ id }),
            headers: { cookie },
        });

        expect(res.status).toBe(204);
    });

    it('deleting non-existent organization returns 404', async () => {
        const res = await api('/api/orgs/delete', {
            method: 'POST',
            body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
            headers: { cookie },
        });

        expect(res.status).toBe(404);
    });
});
