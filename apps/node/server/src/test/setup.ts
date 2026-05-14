import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { Pool, QueryResultRow } from 'pg';

import {
    setInternalIdentity,
    type InternalIdentity,
} from '@qualification-work/microservice-utils/internalAuth';
import { mockInternalIdentity } from '@qualification-work/microservice-utils/test';

import { InitUserCommand } from '@/core/commands';

import { createApp } from '@/adapters/createApp';
import { PgUserRepo } from '@/adapters/driven/repos';
import { RedisUserEventsConsumer } from '@/adapters/driving/consumer';

import type { Config } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';
import { createRedisClient, type RedisClient } from '@/infrastructure/redis';

let pool: Pool;
let redis: RedisClient;
let userEventsConsumer: RedisUserEventsConsumer | undefined;
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

const testConfig: Config = {
    port: 0,
    clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    postgresConnectionString: process.env.DATABASE_URL ?? '',
    redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB ?? 0),
    },
    auth: { jwksUrl: 'unused', jwtIssuer: 'unused', jwtAudience: 'unused' },
};

const testAuthHook = async ({
    request,
}: {
    request: { getHeader(name: string): string | undefined };
}) => {
    setInternalIdentity(request, currentIdentity);
};

export async function truncate(): Promise<void> {
    if (redis?.isReady) {
        await redis.flushDb();
    }

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

export async function createTestUser(
    data: {
        email?: string;
        name?: string;
        family?: string;
        isInitializing?: boolean;
    } = {}
): Promise<{ id: string; name: string }> {
    const email = data.email ?? `test-${randomUUID()}@example.com`;
    const name = data.name ?? 'Test';
    const family = data.family ?? 'User';
    const isInitializing = data.isInitializing ?? false;

    const [user] = await dbQuery<{ id: string; name: string }>(
        `INSERT INTO auth.users (email, password_hash, name, family, is_initializing)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [email, 'not-used-by-node-server', name, family, isInitializing]
    );

    return { id: user.id, name };
}

export async function createTestOrg(
    userId: string,
    data: { name?: string } = {}
): Promise<{ id: string }> {
    const name = data.name ?? `Test Org ${randomUUID()}`;

    const [organization] = await dbQuery<{ id: string }>(
        `INSERT INTO orgs.organizations (name, owner_id)
         VALUES ($1, $2)
         RETURNING id`,
        [name, userId]
    );

    await dbQuery(
        `INSERT INTO orgs.roles (org_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [organization.id, userId]
    );

    return organization;
}

export async function createTestUserWithOrg(): Promise<{
    userId: string;
    orgId: string;
}> {
    const user = await createTestUser();
    const organization = await createTestOrg(user.id);

    return {
        userId: user.id,
        orgId: organization.id,
    };
}

export async function publishUserRegisteredEvent(data: {
    userId: string;
    username: string;
}): Promise<string> {
    return redis.xAdd('auth:user-events', '*', {
        type: 'user.registered',
        version: '1',
        userId: data.userId,
        username: data.username,
        occurredAt: new Date().toISOString(),
    });
}

export async function waitFor(
    assertion: () => Promise<boolean>,
    options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<void> {
    const timeoutMs = options.timeoutMs ?? 5000;
    const intervalMs = options.intervalMs ?? 100;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (await assertion()) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(`condition was not met in ${timeoutMs}ms`);
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

/**
 * Запустить запрос от имени конкретной identity. Идентичность держится на
 * модульной переменной — если в тесте параллельно делаешь несколько вызовов,
 * используй sequentially.
 */
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
        pool = await createPool(testConfig.postgresConnectionString);
        redis = await createRedisClient(testConfig.redis);

        await truncate();

        const initUserRepo = new PgUserRepo(pool);
        const initUserCommand = new InitUserCommand(initUserRepo);
        userEventsConsumer = new RedisUserEventsConsumer(
            redis,
            initUserCommand,
            initUserRepo,
            { blockTime: 100, reconcileIntervalTime: 200 }
        );
        await userEventsConsumer.start();

        const app = createApp(pool, testConfig, { authHook: testAuthHook });
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

    await userEventsConsumer?.stop();

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

    await redis?.close();
    await pool?.end();

    server = undefined;
    userEventsConsumer = undefined;
}
