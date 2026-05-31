import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Dashboard, DashboardMetricItem } from '@qualification-work/types';

import {
    api,
    dbQuery,
    resetTestIdentity,
    startServer,
    stopServer,
    truncate,
} from '../lib';
import { bootFixture, createDashboard, silenceErrors } from './lib';

let orgId: string;
let datasetId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    ({ orgId, datasetId } = await bootFixture());
    silenceErrors();
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

const addMetric = (dashboardId: string, body: Record<string, unknown>) =>
    api(`/api/dashboards/${dashboardId}/items`, {
        method: 'POST',
        body: JSON.stringify({ kind: 'metric', datasetId, ...body }),
    });

const getMetric = async (dashboardId: string): Promise<DashboardMetricItem> => {
    const res = await api(`/api/dashboards/${dashboardId}`);
    const body = (await res.json()) as Dashboard;

    return body.items.find(item => item.kind === 'metric') as DashboardMetricItem;
};

describe('metric engine', () => {
    it('evaluates an arithmetic ratio over aggregates', async () => {
        const dashboardId = await createDashboard(orgId);

        await dbQuery(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'revenue', 'Revenue', 'number', 0),
                ($1, 'orders', 'Orders', 'number', 1)`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, '{"revenue": 100, "orders": 2}'::jsonb),
                ($1, 1, '{"revenue": 140, "orders": 6}'::jsonb)`,
            [datasetId]
        );

        await addMetric(dashboardId, {
            name: 'Average check',
            expression: 'sum(revenue) / sum(orders)',
            format: 'currency',
        });

        const metric = await getMetric(dashboardId);
        expect(metric.value).toBe(30);
    });

    it('builds an ordered trend series from the auto date column', async () => {
        const dashboardId = await createDashboard(orgId);

        await dbQuery(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'amount', 'Amount', 'number', 0),
                ($1, 'created', 'Created', 'date', 1)`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, '{"amount": 10, "created": "2024-01-15"}'::jsonb),
                ($1, 1, '{"amount": 5,  "created": "2024-01-20"}'::jsonb),
                ($1, 2, '{"amount": 7,  "created": "2024-02-03"}'::jsonb)`,
            [datasetId]
        );

        await addMetric(dashboardId, {
            name: 'Monthly revenue',
            expression: 'sum(amount)',
            format: 'currency',
            showTrend: true,
            timeBucket: 'month',
        });

        const metric = await getMetric(dashboardId);
        expect(metric.trend).toHaveLength(2);
        expect(metric.trend?.map(point => point.value)).toEqual([15, 7]);
        const buckets = metric.trend?.map(point => point.bucket) ?? [];
        expect([...buckets].sort()).toEqual(buckets);
    });

    it('omits trend when no date column exists', async () => {
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
            VALUES ($1, 0, '{"amount": 10}'::jsonb)`,
            [datasetId]
        );

        await addMetric(dashboardId, {
            name: 'Revenue',
            expression: 'sum(amount)',
            format: 'currency',
            showTrend: true,
        });

        const metric = await getMetric(dashboardId);
        expect(metric.value).toBe(10);
        expect(metric.trend).toBeNull();
    });
});
