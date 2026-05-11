import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { Pool, QueryResultRow } from 'pg';
import type { FRequest } from 'primitive-server';

import {
    setInternalIdentity,
    type InternalIdentity,
} from '@qualification-work/microservice-utils/internalAuth';
import { mockInternalIdentity } from '@qualification-work/microservice-utils/test';

import { createApp } from '@/adapters/createApp';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';

let pool: Pool;
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

export async function createTestUser(
    data: {
        email?: string;
        name?: string;
        family?: string;
    } = {}
): Promise<{ id: string }> {
    const email = data.email ?? `test-${randomUUID()}@example.com`;
    const name = data.name ?? 'Test';
    const family = data.family ?? 'User';

    const [user] = await dbQuery<{ id: string }>(
        `INSERT INTO auth.users (email, password_hash, name, family)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [email, 'not-used-by-data-service', name, family]
    );

    return user;
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

        await truncate();

        const app = createApp(pool, config, { authHook: testAuthHook });
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

    server = undefined;
}
