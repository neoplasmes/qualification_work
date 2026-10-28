import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { dashboardChartDefaultHeight, type Dashboard } from '@qualification-work/types';

import {
    api,
    apiAs,
    dbQuery,
    resetTestIdentity,
    startServer,
    stopServer,
    truncate,
} from '../lib';
import {
    addChartItem,
    bootFixture,
    createDashboard,
    dashboardIdentity,
    silenceErrors,
} from './lib';

let userId: string;
let orgId: string;
let chartId: string;
let datasetId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    ({ userId, orgId, chartId, datasetId } = await bootFixture());
    silenceErrors();
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('GET /api/dashboards/:id', () => {
    it('returns DTO with empty items after create', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as Dashboard;
        expect(body.id).toBe(dashboardId);
        expect(body.orgId).toBe(orgId);
        expect(body.items).toEqual([]);
    });

    it('items ordered by posY + grid placement', async () => {
        const dashboardId = await createDashboard(orgId);

        await addChartItem(dashboardId, chartId);
        await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'Revenue',
                expression: 'sum(amount)',
                format: '₽',
            }),
        });

        const res = await api(`/api/dashboards/${dashboardId}`);
        const body = (await res.json()) as Dashboard;

        expect(body.items).toHaveLength(2);
        expect(body.items[0].layout.posY).toBe(0);
        expect(body.items[1].layout.posY).toBe(dashboardChartDefaultHeight);
        expect(body.items[0].kind).toBe('chart');
        expect(body.items[1].kind).toBe('metric');
        expect(body.items[0].layout.posX).toBe(0);
        expect(body.items[0].layout.width).toBe(6);
    });

    it('returns calculated metric value', async () => {
        const dashboardId = await createDashboard(orgId);

        await dbQuery(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'amount', 'Amount', 'number', 0)`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, '{"amount": 10}'::jsonb),
                ($1, 1, '{"amount": 15}'::jsonb)`,
            [datasetId]
        );
        await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'Revenue',
                expression: 'sum(amount)',
                format: '₽',
                valueMultiplier: 1,
            }),
        });

        const res = await api(`/api/dashboards/${dashboardId}`);
        const body = (await res.json()) as Dashboard;
        const metric = body.items.find(item => item.kind === 'metric');

        expect(metric).toMatchObject({
            kind: 'metric',
            value: 25,
            format: '₽',
            valueMultiplier: 1,
        });
    });

    it('continues to evaluate a saved metric after its column is disabled', async () => {
        const dashboardId = await createDashboard(orgId);

        const [column] = await dbQuery<{ id: string }>(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'amount', 'Amount', 'number', 0)
            RETURNING id`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, '{"amount": 10}'::jsonb),
                ($1, 1, '{"amount": 15}'::jsonb)`,
            [datasetId]
        );
        await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'Revenue',
                expression: 'sum(amount)',
                format: '₽',
            }),
        });

        await dbQuery(
            `UPDATE data.dataset_columns SET is_analyzable = false WHERE id = $1`,
            [column.id]
        );

        const res = await api(`/api/dashboards/${dashboardId}`);
        const body = (await res.json()) as Dashboard;
        const metric = body.items.find(item => item.kind === 'metric');

        expect(metric).toMatchObject({
            kind: 'metric',
            value: 25,
        });
    });

    it('returns calculated count metric value for a column', async () => {
        const dashboardId = await createDashboard(orgId);

        await dbQuery(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'sku', 'SKU', 'string', 0)`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, '{"sku": "A"}'::jsonb),
                ($1, 1, '{"sku": ""}'::jsonb),
                ($1, 2, '{"other": "B"}'::jsonb)`,
            [datasetId]
        );
        await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'SKU count',
                expression: 'count(sku)',
                format: '',
            }),
        });

        const res = await api(`/api/dashboards/${dashboardId}`);
        const body = (await res.json()) as Dashboard;
        const metric = body.items.find(item => item.kind === 'metric');

        expect(metric).toMatchObject({
            kind: 'metric',
            value: 1,
        });
    });

    it('404 for non-existent id', async () => {
        const res = await api(`/api/dashboards/${randomUUID()}`);
        expect(res.status).toBe(404);
    });

    it('200 for viewer in org', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as Dashboard;
        expect(body.id).toBe(dashboardId);
    });
});
