import { randomUUID } from 'node:crypto';
import { delay } from 'es-toolkit';
import type { QueryResultRow } from 'pg';

import type { InternalIdentity } from '@qualification-work/microservice-utils/auth';

import { getBaseUrl, getPool, getRedis, setTestIdentity } from './setup';

export {
    resetTestIdentity,
    setTestIdentity,
    startServer,
    stopServer,
    truncate,
} from './setup';

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const result = await getPool().query<T>(text, params);

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
        `INSERT INTO orgs.organizations (name, display_name, owner_id)
		VALUES ($1, $1, $2)
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

export async function createTestDataset(
    orgId: string,
    data: { name?: string; sourceType?: 'csv' | 'xlsx' | 'manual' } = {}
): Promise<{ id: string }> {
    const name = data.name ?? `dataset-${randomUUID()}`;
    const sourceType = data.sourceType ?? 'manual';

    const [dataset] = await dbQuery<{ id: string }>(
        `INSERT INTO data.datasets (org_id, name, source_type)
		VALUES ($1, $2, $3)
		RETURNING id`,
        [orgId, name, sourceType]
    );

    return dataset;
}

export async function createTestChart(
    orgId: string,
    datasetId: string,
    data: {
        name?: string;
        chartType?: 'bar' | 'line' | 'pie' | 'kpi' | 'heatmap';
    } = {}
): Promise<{ id: string }> {
    const name = data.name ?? `chart-${randomUUID()}`;
    const chartType = data.chartType ?? 'bar';

    const [chart] = await dbQuery<{ id: string }>(
        `INSERT INTO charts.charts (dataset_id, org_id, name, chart_type)
		VALUES ($1, $2, $3, $4)
		RETURNING id`,
        [datasetId, orgId, name, chartType]
    );

    return chart;
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
    return getRedis().xAdd('auth:user-events', '*', {
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

        await delay(intervalMs);
    }

    throw new Error(`condition was not met in ${timeoutMs}ms`);
}

export function api(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);

    if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(`${getBaseUrl()}${path}`, {
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
