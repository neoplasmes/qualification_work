import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
    api,
    redisGet,
    redisKeys,
    startServer,
    stopServer,
    truncate,
    waitForRedisKeys,
    waitForRedisVersion,
} from './setup';

const user = {
    email: 'cache@example.com',
    password: 'password123',
    name: 'cache',
    family: 'test',
};

async function registerAndLogin(): Promise<{ userId: string; cookie: string }> {
    const regRes = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(user),
    });
    const { id: userId } = (await regRes.json()) as { id: string };

    const loginRes = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const cookie = loginRes.headers.get('set-cookie')!;

    return { userId, cookie };
}

beforeAll(startServer);
afterAll(stopServer);
beforeEach(truncate);

describe('/me cache', () => {
    it('first /me request populates the cache in Redis', async () => {
        const { userId, cookie } = await registerAndLogin();

        await api('/api/auth/me', { headers: { cookie } });

        const keys = await waitForRedisKeys(`me:user:${userId}:version:*`);
        expect(keys.length).toBeGreaterThan(0);
    });

    it('cached data matches /me response', async () => {
        const { userId, cookie } = await registerAndLogin();

        const res = await api('/api/auth/me', { headers: { cookie } });
        const body = (await res.json()) as Record<string, unknown>;

        const keys = await waitForRedisKeys(`me:user:${userId}:version:*:data`);
        expect(keys.length).toBe(1);

        const raw = await redisGet(keys[0]);
        expect(raw).not.toBeNull();

        const cached = JSON.parse(raw!) as Record<string, unknown>;
        expect(cached.id).toBe(body.id);
        expect(cached.email).toBe(body.email);
        expect(cached.name).toBe(body.name);
        expect(cached.family).toBe(body.family);
    });

    it('second /me request is served from cache — version key stays the same', async () => {
        const { userId, cookie } = await registerAndLogin();

        await api('/api/auth/me', { headers: { cookie } });
        await waitForRedisKeys(`me:user:${userId}:version:*`);

        const versionBefore = await redisGet(`me:user:${userId}:version`);

        await api('/api/auth/me', { headers: { cookie } });

        const versionAfter = await redisGet(`me:user:${userId}:version`);
        expect(versionAfter).toBe(versionBefore);
    });

    it('cache version increments after creating an organization', async () => {
        const { userId, cookie } = await registerAndLogin();

        await api('/api/auth/me', { headers: { cookie } });
        await waitForRedisKeys(`me:user:${userId}:version:*`);

        const versionBefore = Number(
            (await redisGet(`me:user:${userId}:version`)) ?? '0'
        );

        await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'New org', ownerId: userId }),
            headers: { cookie },
        });

        const versionAfter = await waitForRedisVersion(
            `me:user:${userId}:version`,
            versionBefore + 1
        );
        expect(versionAfter).toBe(versionBefore + 1);
    });

    it('cache version increments after deleting an organization', async () => {
        const { userId, cookie } = await registerAndLogin();

        // warm up cache
        const meRes = await api('/api/auth/me', { headers: { cookie } });
        const meBody = (await meRes.json()) as { organizations: { id: string }[] };
        await waitForRedisKeys(`me:user:${userId}:version:*`);

        const versionBefore = Number(
            (await redisGet(`me:user:${userId}:version`)) ?? '0'
        );

        // delete the default org
        await api(`/api/orgs/${meBody.organizations[0].id}`, {
            method: 'DELETE',
            headers: { cookie },
        });

        const versionAfter = await waitForRedisVersion(
            `me:user:${userId}:version`,
            versionBefore + 1
        );
        expect(versionAfter).toBe(versionBefore + 1);
    });

    it('after invalidation the next /me writes a new cache entry with the updated version', async () => {
        const { userId, cookie } = await registerAndLogin();

        await api('/api/auth/me', { headers: { cookie } });
        await waitForRedisKeys(`me:user:${userId}:version:*`);

        // invalidate via org creation
        await api('/api/orgs', {
            method: 'POST',
            body: JSON.stringify({ name: 'Invalidating org', ownerId: userId }),
            headers: { cookie },
        });

        // request /me again - should write cache with the new version
        await api('/api/auth/me', { headers: { cookie } });

        const currentVersion = await redisGet(`me:user:${userId}:version`);
        const newKeys = await waitForRedisKeys(
            `me:user:${userId}:version:${currentVersion}:data`
        );
        expect(newKeys.length).toBe(1);

        const raw = await redisGet(newKeys[0]);
        const cached = JSON.parse(raw!) as { organizations: unknown[] };
        // should contain default org + the new one
        expect(cached.organizations).toHaveLength(2);
    });

    it('logout removes the session but keeps the /me cache', async () => {
        const { userId, cookie } = await registerAndLogin();

        await api('/api/auth/me', { headers: { cookie } });
        await waitForRedisKeys(`me:user:${userId}:version:*`);

        await api('/api/auth/logout', { method: 'POST', headers: { cookie } });

        // session is gone
        const sessionKeys = await redisKeys('session:*');
        expect(sessionKeys.length).toBe(0);

        // /me-cache is still there
        const cacheKeys = await redisKeys(`me:user:${userId}:version:*`);
        expect(cacheKeys.length).toBeGreaterThan(0);
    });
});
