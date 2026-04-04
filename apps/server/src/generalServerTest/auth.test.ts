import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    api,
    redisGet,
    startServer,
    stopServer,
    truncate,
    waitForRedisKeys,
} from './setup';

const user = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Jonh',
    family: 'Doe',
};

beforeAll(startServer);
afterAll(stopServer);
beforeEach(truncate);
beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/auth/register', () => {
    it('successful registration, returns 201', async () => {
        const res = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(user),
        });

        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe('string');
    });

    it('automatically creates an organization after registration', async () => {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(user) });

        const loginRes = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, password: user.password }),
        });
        const cookie = loginRes.headers.get('set-cookie')!;

        const meRes = await api('/api/auth/me', { headers: { cookie } });
        const body = (await meRes.json()) as {
            organizations: { name: string; role: string }[];
        };

        expect(body.organizations).toHaveLength(1);
        expect(body.organizations[0].name).toContain(user.name);
        expect(body.organizations[0].role).toBe('owner');
    });

    it('re-registering with the same email returns 409', async () => {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(user) });

        const res = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(user),
        });

        expect(res.status).toBe(409);
    });

    it('invalid data returns 400 with fields', async () => {
        const res = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'asafasfasfaf',
                password: '123',
                name: '',
                family: '',
            }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as { fields: unknown };
        expect(body).toHaveProperty('fields');
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(user) });
    });

    it('successful login, returns 204 + cookie session', async () => {
        const res = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, password: user.password }),
        });

        expect(res.status).toBe(204);
        expect(res.headers.get('set-cookie')).toContain('session=');
    });

    it('invalid password returns 401', async () => {
        const res = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, password: 'wrong12345' }),
        });

        expect(res.status).toBe(401);
    });

    it('non-existent email returns 401', async () => {
        const res = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'nobody@example.com',
                password: 'password123',
            }),
        });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/auth/me', () => {
    let cookie: string;

    beforeEach(async () => {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(user) });

        const res = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, password: user.password }),
        });
        cookie = res.headers.get('set-cookie')!;
    });

    it('with valid cookie returns 200 + user data', async () => {
        const res = await api('/api/auth/me', { headers: { cookie } });

        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            email: string;
            name: string;
            family: string;
            organizations: unknown[];
        };
        expect(body.email).toBe(user.email);
        expect(body.name).toBe(user.name);
        expect(body.family).toBe(user.family);
        expect(Array.isArray(body.organizations)).toBe(true);
    });

    it('stores /me payload in redis and serves the same payload on repeated calls', async () => {
        const firstRes = await api('/api/auth/me', { headers: { cookie } });
        expect(firstRes.status).toBe(200);

        const firstBody = (await firstRes.json()) as {
            id: string;
            email: string;
            name: string;
            family: string;
            organizations: { id: string; name: string; role: string }[];
        };

        const keys = await waitForRedisKeys(`me:user:${firstBody.id}:version:*:data`);
        expect(keys).toHaveLength(1);

        const cachedRaw = await redisGet(keys[0]);
        expect(cachedRaw).not.toBeNull();
        const cached = JSON.parse(cachedRaw ?? '{}') as typeof firstBody;
        expect(cached).toEqual(firstBody);

        const secondRes = await api('/api/auth/me', { headers: { cookie } });
        expect(secondRes.status).toBe(200);
        const secondBody = (await secondRes.json()) as typeof firstBody;

        expect(secondBody).toEqual(firstBody);
    });

    it('without cookie returns 400 (empty token fails validation)', async () => {
        const res = await api('/api/auth/me');
        expect(res.status).toBe(400);
    });

    it('with invalid cookie returns 401', async () => {
        const res = await api('/api/auth/me', {
            headers: { cookie: 'session=fake-token' },
        });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/auth/logout', () => {
    it('logout returns 204 and then /me returns 401', async () => {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(user) });

        const loginRes = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, password: user.password }),
        });
        const cookie = loginRes.headers.get('set-cookie')!;

        const logoutRes = await api('/api/auth/logout', {
            method: 'POST',
            headers: { cookie },
        });
        expect(logoutRes.status).toBe(204);

        const meRes = await api('/api/auth/me', { headers: { cookie } });
        expect(meRes.status).toBe(401);
    });
});
