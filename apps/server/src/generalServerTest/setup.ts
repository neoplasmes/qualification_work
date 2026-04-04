import { createApp } from '@/implementation/createApp';
import { createPool } from '@/infrastructure/postgres';
import { createRedisClient, type RedisClient } from '@/infrastructure/redis';
import type { Pool } from 'pg';

let pool: Pool;
let redis: RedisClient;
let baseUrl: string;
let started = false;
let refCount = 0;

export async function startServer(): Promise<void> {
    refCount++;

    if (started) {
        return;
    }
    started = true;

    const pepper = process.env.PEPPER;
    if (!pepper) {
        throw new Error('PEPPER has not been set');
    }

    pool = await createPool();
    redis = await createRedisClient();

    const app = createApp(pool, redis, pepper);
    const server = await app.listen({ port: 0 });

    const addr = server.address();
    if (!addr || typeof addr === 'string') {
        throw new Error('??????????????????????????????');
    }

    baseUrl = `http://127.0.0.1:${addr.port}`;
}

export async function stopServer(): Promise<void> {
    refCount--;

    if (refCount > 0) {
        return;
    }

    await pool.end();
    await redis.quit();
}

export async function truncate(): Promise<void> {
    await pool.query(`TRUNCATE auth.users, orgs.organizations, orgs.roles CASCADE`);
    await redis.flushDb();
}

export async function redisKeys(pattern: string): Promise<string[]> {
    return redis.keys(pattern);
}

export async function waitForRedisKeys(
    pattern: string,
    timeoutMs = 1000,
    intervalMs = 10
): Promise<string[]> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
            return keys;
        }

        await new Promise(resolve => {
            setTimeout(resolve, intervalMs);
        });
    }

    return [];
}

export async function redisGet(key: string): Promise<string | null> {
    return redis.get(key);
}

export async function waitForRedisVersion(
    key: string,
    expected: number,
    timeoutMs = 1000,
    intervalMs = 10
): Promise<number> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const raw = await redis.get(key);
        const current = Number(raw ?? '0');

        if (current >= expected) {
            return current;
        }

        await new Promise(resolve => {
            setTimeout(resolve, intervalMs);
        });
    }

    const raw = await redis.get(key);

    return Number(raw ?? '0');
}

export function api(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
    });
}
