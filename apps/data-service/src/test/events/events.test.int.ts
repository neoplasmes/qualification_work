import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { withTransaction } from '@qualification-work/microservice-utils/postgres';
import { RedisCache } from '@qualification-work/microservice-utils/redis';

import { createOrgCleanupHandler } from '@/adapters/driving/consumer';

import {
    createTestUserWithOrg,
    dbQuery,
    getPool,
    getTestRedis,
    resetTestIdentity,
    startServer,
    stopServer,
    truncate,
} from '../setup';

beforeAll(startServer);
afterAll(stopServer);

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

const outboxEvents = () =>
    dbQuery<{ type: string; aggregate: string; version: string | null }>(
        `SELECT payload->>'type' AS type,
            payload->>'aggregateId' AS aggregate,
            payload->'payload'->>'dataVersion' AS version
        FROM data.outbox
        ORDER BY id`
    );

const insertDataset = async (orgId: string) => {
    const [dataset] = await dbQuery<{ id: string }>(
        `INSERT INTO data.datasets (org_id, name, source_type)
        VALUES ($1, 'events', 'manual')
        RETURNING id`,
        [orgId]
    );

    return dataset.id;
};

describe('outbox triggers', () => {
    it('bumps data version once per row statement', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await insertDataset(orgId);

        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            SELECT $1, g, '{}'::jsonb FROM generate_series(1, 100) g`,
            [datasetId]
        );

        expect(await outboxEvents()).toEqual([
            { type: 'DatasetChanged', aggregate: datasetId, version: '1' },
            { type: 'DatasetChanged', aggregate: datasetId, version: '2' },
        ]);
    });

    it('publishes deletions of a dataset and its charts', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await insertDataset(orgId);
        const [chart] = await dbQuery<{ id: string }>(
            `INSERT INTO charts.charts (dataset_id, org_id, name, chart_type)
            VALUES ($1, $2, 'c', 'bar')
            RETURNING id`,
            [datasetId, orgId]
        );

        await dbQuery(`DELETE FROM data.datasets WHERE id = $1`, [datasetId]);

        const types = (await outboxEvents()).map(
            event => `${event.type}:${event.aggregate}`
        );
        expect(types).toContain(`DatasetDeleted:${datasetId}`);
        expect(types).toContain(`ChartDeleted:${chart.id}`);
    });
});

describe('org cleanup consumer', () => {
    it('removes every entity of a deleted org and leaves other orgs intact', async () => {
        const { orgId } = await createTestUserWithOrg();
        const otherOrgId = randomUUID();
        await insertDataset(orgId);
        const keptDatasetId = await insertDataset(otherOrgId);

        const handler = createOrgCleanupHandler(
            new RedisCache(getTestRedis(), {
                namespace: 'data-service',
                defaultTtlMs: 60_000,
            })
        );
        const afterCommit = await withTransaction(getPool(), client =>
            handler(client, {
                eventId: randomUUID(),
                type: 'OrgDeleted',
                version: 1,
                occurredAt: new Date().toISOString(),
                aggregateId: orgId,
                orgId,
                payload: {},
            })
        );
        await afterCommit?.();

        const left = await dbQuery<{ id: string }>(`SELECT id FROM data.datasets`);
        expect(left).toEqual([{ id: keptDatasetId }]);
    });
});
