import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';

import type { Dashboard } from '@qualification-work/types';

import { JsepMetricExpressionTool } from '@/adapters/driven/tools';

import { PgDashboardRepo } from './pg.dashboard.repo';

type QueryCall = { text: string; params: unknown[] };

// fake pool that records queries and answers the three scan kinds findById issues
class FakePool {
    readonly calls: QueryCall[] = [];

    constructor(private readonly aggregateRow: Record<string, string>) {}

    get aggregateScans(): number {
        return this.calls.filter(
            call =>
                call.text.includes('FROM data.dataset_rows') &&
                !call.text.includes('GROUP BY')
        ).length;
    }

    query(text: string, params: unknown[] = []): Promise<{ rows: unknown[] }> {
        this.calls.push({ text, params });

        if (text.includes('json_agg')) {
            return Promise.resolve({ rows: [dashboardRow()] });
        }

        if (text.includes('FROM data.dataset_columns')) {
            return Promise.resolve({
                rows: [
                    { key: 'a', data_type: 'number', is_analyzable: true },
                    { key: 'b', data_type: 'number', is_analyzable: true },
                ],
            });
        }

        return Promise.resolve({ rows: [this.aggregateRow] });
    }
}

const metric = (id: string, expression: string) => ({
    id,
    kind: 'metric' as const,
    datasetId: 'dataset-1',
    name: id,
    expression,
    format: '',
    valueMultiplier: 1,
    showTrend: false,
    timeColumn: null,
    timeBucket: null,
    layout: { posX: 0, posY: 0, width: 12, height: 4 },
});

function dashboardRow() {
    return {
        id: 'dash-1',
        org_id: 'org-1',
        name: 'Dash',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        items: [
            metric('m-sum-a', 'sum(a)'),
            metric('m-avg-a', 'avg(a)'),
            metric('m-sum-b', 'sum(b)'),
            metric('m-ratio', 'sum(a) / sum(b)'),
        ],
    };
}

function makeRepo(aggregateRow: Record<string, string>) {
    const pool = new FakePool(aggregateRow);
    const repo = new PgDashboardRepo(
        pool as unknown as Pool,
        new JsepMetricExpressionTool()
    );

    return { pool, repo };
}

describe('PgDashboardRepo metric evaluation', () => {
    it('scans the dataset once for many metrics (no N+1)', async () => {
        // t0 = sum(a), t1 = avg(a), t2 = sum(b)
        const { pool, repo } = makeRepo({ t0: '30', t1: '10', t2: '8' });

        await repo.findById('dash-1', ['org-1']);

        expect(pool.aggregateScans).toBe(1);
    });

    it('folds arithmetic over shared aggregate values', async () => {
        const { repo } = makeRepo({ t0: '30', t1: '10', t2: '8' });

        const dashboard = (await repo.findById('dash-1', ['org-1'])) as Dashboard;
        const valueOf = (id: string) =>
            dashboard.items.find(item => item.id === id) as { value: number | null };

        expect(valueOf('m-sum-a').value).toBe(30);
        expect(valueOf('m-avg-a').value).toBe(10);
        expect(valueOf('m-sum-b').value).toBe(8);
        expect(valueOf('m-ratio').value).toBeCloseTo(30 / 8);
    });

    it('returns null on division by zero', async () => {
        const { repo } = makeRepo({ t0: '30', t1: '10', t2: '0' });

        const dashboard = (await repo.findById('dash-1', ['org-1'])) as Dashboard;
        const ratio = dashboard.items.find(item => item.id === 'm-ratio') as {
            value: number | null;
        };

        expect(ratio.value).toBeNull();
    });
});
