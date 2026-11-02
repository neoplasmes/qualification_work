import { randomUUID } from 'node:crypto';
import { delay } from 'es-toolkit';
import type { QueryResultRow } from 'pg';

import type { InternalIdentity } from '@qualification-work/microservice-utils/auth';

import { getBaseUrl, getPool, setTestIdentity } from './setup';

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

export async function createTestUserWithOrg(): Promise<{
    userId: string;
    orgId: string;
}> {
    // users and orgs live in auth, server only sees their ids in the identity
    return { userId: randomUUID(), orgId: randomUUID() };
}

export async function createTestDataset(
    orgId: string,
    data: { name?: string } = {}
): Promise<{ id: string }> {
    const [dataset] = await dbQuery<{ id: string }>(
        `INSERT INTO dashboards.dataset_refs (id, org_id, name, data_version)
		VALUES ($1, $2, $3, 1)
		RETURNING id`,
        [randomUUID(), orgId, data.name ?? `dataset-${randomUUID()}`]
    );

    return dataset;
}

export async function setDatasetColumns(
    datasetId: string,
    columns: Array<{ key: string; isAnalyzable: boolean }>
): Promise<void> {
    await dbQuery(`UPDATE dashboards.dataset_refs SET columns = $2 WHERE id = $1`, [
        datasetId,
        JSON.stringify(columns.map(column => ({ ...column, dataType: 'number' }))),
    ]);
}

export async function createTestChart(
    orgId: string,
    datasetId: string,
    data: { name?: string } = {}
): Promise<{ id: string }> {
    const [chart] = await dbQuery<{ id: string }>(
        `INSERT INTO dashboards.chart_refs (id, org_id, dataset_id, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id`,
        [randomUUID(), orgId, datasetId, data.name ?? `chart-${randomUUID()}`]
    );

    return chart;
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
