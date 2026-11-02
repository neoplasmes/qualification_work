import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type {
    EvaluateMetricsResponse,
    MetricEvaluationResult,
} from '@qualification-work/types';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    resetTestIdentity,
    startServer,
    stopServer,
    truncate,
} from '../setup';

let datasetId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    const { orgId } = await createTestUserWithOrg();
    const [dataset] = await dbQuery<{ id: string }>(
        `INSERT INTO data.datasets (org_id, name, source_type)
        VALUES ($1, 'metrics', 'manual')
        RETURNING id`,
        [orgId]
    );
    datasetId = dataset.id;
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

const previewMetric = (body: Record<string, unknown>) =>
    api('/api/metrics/preview', {
        method: 'POST',
        body: JSON.stringify({ datasetId, ...body }),
    });

const evaluateMetric = async (
    body: Record<string, unknown>
): Promise<MetricEvaluationResult> => {
    const res = await api('/api/metrics/evaluate', {
        method: 'POST',
        body: JSON.stringify({
            items: [
                {
                    id: 'metric',
                    datasetId,
                    showTrend: false,
                    timeColumn: null,
                    timeBucket: null,
                    ...body,
                },
            ],
        }),
    });
    const result = (await res.json()) as EvaluateMetricsResponse;

    return result.results.metric;
};

describe('metric engine', () => {
    it('previews an unsaved metric and keeps the preview briefly cached', async () => {
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
                ($1, 1, '{"amount": 5}'::jsonb)`,
            [datasetId]
        );

        const first = await previewMetric({ expression: 'sum(amount)' });
        const firstBody = (await first.json()) as { value: number | null };

        expect(first.status).toBe(200);
        expect(firstBody.value).toBe(15);

        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES ($1, 2, '{"amount": 20}'::jsonb)`,
            [datasetId]
        );

        const cached = await previewMetric({ expression: 'sum(amount)' });
        const cachedBody = (await cached.json()) as { value: number | null };
        const changed = await previewMetric({ expression: 'sum(amount) + 1' });
        const changedBody = (await changed.json()) as { value: number | null };

        expect(cachedBody.value).toBe(15);
        expect(changedBody.value).toBe(36);
    });

    it('previews a metric that references a column key with spaces', async () => {
        await dbQuery(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'Визитов за месяц', 'Визитов за месяц', 'number', 0)`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, jsonb_build_object('Визитов за месяц', 10)),
                ($1, 1, jsonb_build_object('Визитов за месяц', 5))`,
            [datasetId]
        );

        const res = await previewMetric({
            expression: 'sum("Визитов за месяц")',
        });
        const body = (await res.json()) as { value: number | null };

        expect(res.status).toBe(200);
        expect(body.value).toBe(15);
    });

    it('evaluates an arithmetic ratio over aggregates', async () => {
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

        const metric = await evaluateMetric({
            name: 'Average check',
            expression: 'sum(revenue) / sum(orders)',
            format: '₽',
        });

        expect(metric.value).toBe(30);
    });

    it('builds an ordered trend series from the auto date column', async () => {
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

        const metric = await evaluateMetric({
            name: 'Monthly revenue',
            expression: 'sum(amount)',
            format: '₽',
            showTrend: true,
            timeBucket: 'month',
        });

        expect(metric.trend).toHaveLength(2);
        expect(metric.trend?.map(point => point.value)).toEqual([15, 7]);
        const buckets = metric.trend?.map(point => point.bucket) ?? [];
        expect([...buckets].sort()).toEqual(buckets);
    });

    it('builds a trend series from dotted dates and quoted column keys', async () => {
        await dbQuery(
            `INSERT INTO data.dataset_columns
                (dataset_id, key, display_name, data_type, order_index)
            VALUES
                ($1, 'Средний чек', 'Средний чек', 'number', 0),
                ($1, 'Дата', 'Дата', 'date', 1)`,
            [datasetId]
        );
        await dbQuery(
            `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
            VALUES
                ($1, 0, jsonb_build_object('Средний чек', 10, 'Дата', '02.01.2025')),
                ($1, 1, jsonb_build_object('Средний чек', 20, 'Дата', '23.04.2025')),
                ($1, 2, jsonb_build_object('Средний чек', 30, 'Дата', '2025-04-24T00:00:00.000Z'))`,
            [datasetId]
        );

        const metric = await evaluateMetric({
            name: 'Average check',
            expression: 'avg("Средний чек")',
            format: '₽',
            showTrend: true,
            timeColumn: 'Дата',
            timeBucket: 'month',
        });

        expect(metric.trend).toHaveLength(2);
        expect(metric.trend?.map(point => point.value)).toEqual([10, 25]);
    });

    it('omits trend when no date column exists', async () => {
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

        const metric = await evaluateMetric({
            name: 'Revenue',
            expression: 'sum(amount)',
            format: '₽',
            showTrend: true,
        });

        expect(metric.value).toBe(10);
        expect(metric.trend).toBeNull();
    });

    it('returns null for datasets outside the caller orgs', async () => {
        await createTestUserWithOrg();

        const metric = await evaluateMetric({ expression: 'count()' });

        expect(metric).toEqual({ value: null, trend: null });
    });
});
