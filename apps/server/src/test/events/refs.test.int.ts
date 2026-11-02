import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
    createChartRefsHandler,
    createDatasetRefsHandler,
    createOrgCleanupHandler,
} from '@/adapters/driving/consumer';

import { api, dbQuery, startServer, stopServer, truncate } from '../lib';
import { addChartItem, bootFixture, createDashboard } from '../dashboard/lib';
import { getCache, getPool } from '../setup';

const envelope = (type: string, aggregateId: string, orgId: string, payload: object) => ({
    eventId: randomUUID(),
    version: 1 as const,
    occurredAt: new Date().toISOString(),
    type,
    aggregateId,
    orgId,
    payload,
});

// runs a handler the way EventConsumer does: inside one transaction
async function handle<E>(
    handler: (client: never, event: E) => Promise<unknown>,
    event: E
): Promise<void> {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const afterCommit = await handler(client as never, event);
        await client.query('COMMIT');
        if (typeof afterCommit === 'function') {
            await afterCommit();
        }
    } finally {
        client.release();
    }
}

describe('kafka read models', () => {
    beforeAll(startServer);
    afterAll(stopServer);
    beforeEach(truncate);

    it('upserts dataset ref and ignores stale versions', async () => {
        const handler = createDatasetRefsHandler(getCache());
        const id = randomUUID();
        const orgId = randomUUID();
        const columns = [{ key: 'amount', dataType: 'number', isAnalyzable: true }];

        await handle(
            handler,
            envelope('DatasetChanged', id, orgId, {
                name: 'new',
                columns,
                dataVersion: 2,
            }) as never
        );
        await handle(
            handler,
            envelope('DatasetChanged', id, orgId, {
                name: 'old',
                columns,
                dataVersion: 1,
            }) as never
        );

        const rows = await dbQuery<{ name: string }>(
            'SELECT name FROM dashboards.dataset_refs WHERE id = $1',
            [id]
        );
        expect(rows).toEqual([{ name: 'new' }]);
    });

    it('removes dashboard items of a deleted chart', async () => {
        const { orgId, chartId } = await bootFixture();
        const dashboardId = await createDashboard(orgId);
        await addChartItem(dashboardId, chartId);

        await handle(
            createChartRefsHandler(getCache()),
            envelope('ChartDeleted', chartId, orgId, {}) as never
        );

        const res = await api(`/api/dashboards/${dashboardId}`);
        const body = (await res.json()) as { items: unknown[] };
        expect(body.items).toHaveLength(0);
    });

    it('drops org dashboards on OrgDeleted', async () => {
        const { orgId } = await bootFixture();
        await createDashboard(orgId);

        await handle(
            createOrgCleanupHandler(getCache()),
            envelope('OrgDeleted', orgId, orgId, {}) as never
        );

        const rows = await dbQuery(
            'SELECT id FROM dashboards.dashboards WHERE org_id = $1',
            [orgId]
        );
        expect(rows).toHaveLength(0);
    });
});
