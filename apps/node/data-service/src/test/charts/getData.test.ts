import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { createChart, encodeFilters, getColumnId, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('GET /api/charts/:id/data - bar', () => {
    it('returns aggregated bar data grouped by dimension', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [{ columnId: scoreId, aggregate: 'avg' }],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            kind: string;
            columns: { name: string; role: string }[];
            rows: Array<Array<string | number | null>>;
            truncated: boolean;
        };

        expect(body.kind).toBe('bar');
        expect(body.columns[0]).toMatchObject({ name: 'dim', role: 'dim' });
        expect(body.columns[1]).toMatchObject({ name: 'm0', role: 'measure' });
        expect(body.rows.length).toBeGreaterThan(0);
        expect(body.truncated).toBe(false);
        for (const row of body.rows) {
            expect(typeof row[0]).toBe('string');
            expect(typeof row[1]).toBe('number');
        }
    });
});

describe('GET /api/charts/:id/data - pie', () => {
    it('returns aggregated pie slices', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const countryId = await getColumnId(datasetId, 'country');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'pie',
            slice: { columnId: countryId },
            measure: { columnId: scoreId, aggregate: 'sum' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            kind: string;
            rows: Array<Array<string | number | null>>;
        };
        expect(body.kind).toBe('pie');
        expect(body.rows.length).toBeGreaterThan(0);
        for (const row of body.rows) {
            expect(typeof row[0]).toBe('string');
            expect(typeof row[1]).toBe('number');
        }
    });

    it('applies topN and otherBucket', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const countryId = await getColumnId(datasetId, 'country');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'pie',
            slice: { columnId: countryId, topN: 3, otherBucket: true },
            measure: { columnId: scoreId, aggregate: 'count' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<unknown> };
        expect(body.rows.length).toBeLessThanOrEqual(4);
    });
});

describe('GET /api/charts/:id/data - line', () => {
    it('returns line data with time-binned dimension', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const dateId = await getColumnId(datasetId, 'signupDate');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'line',
            dimension: { columnId: dateId, bin: { kind: 'time', granularity: 'day' } },
            measures: [{ columnId: scoreId, aggregate: 'avg' }],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { kind: string; rows: unknown[] };
        expect(body.kind).toBe('line');
        expect(body.rows.length).toBeGreaterThan(0);
    });
});

describe('GET /api/charts/:id/data - heatmap', () => {
    it('returns heatmap cells for two dimensions', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const countryId = await getColumnId(datasetId, 'country');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'heatmap',
            x: { columnId: cityId },
            y: { columnId: countryId },
            measure: { columnId: scoreId, aggregate: 'avg' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            kind: string;
            columns: { role: string }[];
            rows: unknown[];
        };
        expect(body.kind).toBe('heatmap');
        expect(body.columns.map(c => c.role)).toEqual(['dim', 'dim', 'measure']);
        expect(body.rows.length).toBeGreaterThan(0);
    });
});

describe('GET /api/charts/:id/data - filterOverrides', () => {
    it('filters rows via base64-encoded query param', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');
        const countryId = await getColumnId(datasetId, 'country');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
        });

        const filters = encodeFilters([
            { columnId: countryId, op: 'eq', value: 'France' },
        ]);
        const res = await api(`/api/charts/${chartId}/data?filterOverrides=${filters}`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<[string, number | null]> };
        expect(body.rows).toHaveLength(1);
        expect(body.rows[0][0]).toBe('Paris');
    });
});

describe('GET /api/charts/:id/data - errors', () => {
    it('returns 404 for unknown chartId', async () => {
        const res = await api('/api/charts/00000000-0000-0000-0000-000000000000/data');
        expect(res.status).toBe(404);
    });
});
