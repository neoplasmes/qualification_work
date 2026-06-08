import type { Server } from 'node:http';
import type { Pool } from 'pg';

import {
    setInternalIdentity,
    type InternalIdentity,
} from '@qualification-work/microservice-utils/auth';
import { mockInternalIdentity } from '@qualification-work/microservice-utils/test-utils';

import { InitUserCommand } from '@/core/commands';

import { createApp } from '@/adapters/createApp';
import { PgUserRepo } from '@/adapters/driven/repos';
import { RedisUserEventsConsumer } from '@/adapters/driving/consumer';

import type { Config } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';
import { createRedisClient, type RedisClient } from '@/infrastructure/redis';

let pool: Pool;
let redis: RedisClient;
let cacheRedis: RedisClient | undefined;
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

export function getPool(): Pool {
    return pool;
}

export function getRedis(): RedisClient {
    return redis;
}

export function getBaseUrl(): string {
    return baseUrl;
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
    if (cacheRedis?.isReady && cacheRedis !== redis) {
        await cacheRedis.flushDb();
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

export async function startServer(): Promise<void> {
    refCount++;

    if (started) {
        return;
    }

    try {
        pool = await createPool(testConfig.postgresConnectionString);
        redis = await createRedisClient(testConfig.redis);
        cacheRedis = await createRedisClient(testConfig.redis);

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

        const app = createApp(pool, cacheRedis, testConfig, { authHook: testAuthHook });
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
    await cacheRedis?.close();
    await pool?.end();

    server = undefined;
    cacheRedis = undefined;
    userEventsConsumer = undefined;
}
