import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Pool, QueryResultRow } from 'pg';
import type { FRequest } from 'primitive-server';

import {
    setInternalIdentity,
    type InternalIdentity,
} from '@qualification-work/microservice-utils/auth';
import { runMigrations } from '@qualification-work/microservice-utils/postgres';
import {
    createRedisClient,
    type RedisClient,
} from '@qualification-work/microservice-utils/redis';
import { mockInternalIdentity } from '@qualification-work/microservice-utils/test-utils';

import { createApp } from '@/adapters/createApp';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';

let pool: Pool;
let redis: RedisClient | undefined;
let baseUrl: string;
let server: Server | undefined;
let started = false;
let refCount = 0;

let currentIdentity: InternalIdentity = mockInternalIdentity();

export function setTestIdentity(identity: InternalIdentity): void {
    currentIdentity = identity;
}

export function resetTestIdentity(): void {
    currentIdentity = mockInternalIdentity();
}

const testAuthHook = async ({ request }: { request: FRequest }) => {
    setInternalIdentity(request, currentIdentity);
};

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
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const result = await pool.query<T>(text, params);

    return result.rows;
}

// users and orgs live in auth, data-service only sees their ids through the jwt
export async function createTestUser(): Promise<{ id: string }> {
    return { id: randomUUID() };
}

export async function createTestOrg(_userId: string): Promise<{ id: string }> {
    return { id: randomUUID() };
}

export async function createTestUserWithOrg(): Promise<{
    userId: string;
    orgId: string;
}> {
    const user = await createTestUser();
    const organization = await createTestOrg(user.id);

    setTestIdentity({
        userId: user.id,
        orgs: [{ id: organization.id, role: 'owner' }],
    });

    return {
        userId: user.id,
        orgId: organization.id,
    };
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

export async function apiAs(
    identity: InternalIdentity,
    path: string,
    init?: RequestInit
): Promise<Response> {
    setTestIdentity(identity);

    return api(path, init);
}

export async function startServer(): Promise<void> {
    refCount++;

    if (started) {
        return;
    }

    try {
        const config = loadConfig();
        pool = await createPool(config.postgresConnectionString);
        await runMigrations(
            pool,
            fileURLToPath(new URL('../../migrations', import.meta.url))
        );
        redis = await createRedisClient(config.redis);

        await truncate();
        await redis.flushDb();

        const app = createApp(pool, redis, config, {
            authHook: testAuthHook,
            disableMergeCleanup: true,
        });
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
        server?.closeAllConnections();
        server?.close(error => {
            if (error) {
                reject(error);

                return;
            }

            resolve();
        });
    });

    await pool?.end();
    await redis?.close();

    server = undefined;
    redis = undefined;
}

export function getTestRedis(): RedisClient {
    if (!redis) {
        throw new Error('redis client not initialized - call startServer first');
    }

    return redis;
}

export function getPool(): Pool {
    return pool;
}
