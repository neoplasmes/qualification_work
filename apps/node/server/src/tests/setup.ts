import type { Server } from 'node:http';
import type { Pool, QueryResultRow } from 'pg';

import { createApp } from '@/implementation/createApp';

import { createPool } from '@/infrastructure/postgres';
import { createRedisClient, type RedisClient } from '@/infrastructure/redis';

let pool: Pool;
let redis: RedisClient;
let baseUrl: string;
let server: Server | undefined;
let started = false;
let refCount = 0;

export async function truncate(): Promise<void> {
    const { rows } = await pool.query<{ schema_name: string }>(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
          AND schema_name NOT LIKE 'pg_toast%'
          AND schema_name NOT LIKE 'pg_temp_%'
        ORDER BY schema_name
    `);

    for (const { schema_name } of rows) {
        await pool.query('SELECT truncate_all_tables($1)', [schema_name]);
    }

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

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const result = await pool.query<T>(text, params);

    return result.rows;
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
    const headers = new Headers(init?.headers);

    if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(`${baseUrl}${path}`, {
        headers,
        ...init,
    });
}

export async function startServer(): Promise<void> {
    refCount++;

    if (started) {
        return;
    }

    const pepper = process.env.PEPPER;
    if (!pepper) {
        throw new Error('PEPPER has not been set');
    }

    try {
        pool = await createPool();
        redis = await createRedisClient();

        await truncate();

        const app = createApp(pool, redis, pepper);
        server = await app.listen({ port: 0 });

        const addr = server.address();
        if (!addr || typeof addr === 'string') {
            throw new Error('Failed to get server address');
        }

        baseUrl = `http://127.0.0.1:${addr.port}`;
        started = true;
    } catch (error) {
        refCount--;
        started = false;

        throw error;
    }
}

export async function stopServer(): Promise<void> {
    refCount--;

    if (refCount > 0 || !started) {
        return;
    }

    started = false;

    await new Promise<void>((resolve, reject) => {
        server?.close(error => {
            if (error) {
                reject(error);

                return;
            }

            resolve();
        });
    });

    await pool?.end();
    await redis?.quit();

    server = undefined;
}
