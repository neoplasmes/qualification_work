import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { createChart, encodeFilters, getColumnId, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

async function uploadCsvDataset(
    orgId: string,
    csv: string,
    fileName: string
): Promise<string> {
    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), fileName);

    const res = await api(`/api/datasets?orgId=${orgId}`, { method: 'POST', body: form });
    const body = (await res.json()) as { id: string };

    return body.id;
}

async function uploadWeekdayDataset(orgId: string): Promise<string> {
    return uploadCsvDataset(
        orgId,
        [
            'weekday,shop,score',
            'Sunday,B,7',
            'Monday,A,5',
            'Friday,A,4',
            'Wednesday,B,3',
            'Tuesday,A,2',
            'Thursday,B,6',
            'Saturday,A,1',
        ].join('\n'),
        'weekday.csv'
    );
}

describe('GET /api/charts/:id/data - bar', () => {
    it('returns aggregated bar data grouped by dimension', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [{ columnId: scoreId, aggregate: 'avg', valueFormat: 'rub' }],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            kind: string;
            columns: { name: string; role: string; valueFormat?: string }[];
            rows: Array<Array<string | number | null>>;
            truncated: boolean;
        };

        expect(body.kind).toBe('bar');
        expect(body.columns[0]).toMatchObject({ name: 'dim', role: 'dim' });
        expect(body.columns[1]).toMatchObject({
            name: 'm0',
            role: 'measure',
            valueFormat: 'rub',
        });
        expect(body.rows.length).toBeGreaterThan(0);
        expect(body.truncated).toBe(false);
        for (const row of body.rows) {
            expect(typeof row[0]).toBe('string');
            expect(typeof row[1]).toBe('number');
        }
    });

    it('sorts day_of_week dimensions from Monday to Sunday', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadWeekdayDataset(orgId);
        const weekdayId = await getColumnId(datasetId, 'weekday');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: weekdayId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
            orderBy: { ref: 'measure', index: 0, dir: 'desc' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            columns: Array<{ type: string }>;
            rows: Array<Array<string | number | null>>;
        };
        expect(body.columns[0].type).toBe('day_of_week');
        expect(body.rows.map(row => row[0])).toEqual([
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
        ]);
    });

    it('sorts plain string dimensions alphabetically', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadCsvDataset(
            orgId,
            ['city,score', 'Zurich,1', 'Amsterdam,2', 'Berlin,3'].join('\n'),
            'cities.csv'
        );
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
            orderBy: { ref: 'measure', index: 0, dir: 'desc' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<Array<string | number | null>> };
        expect(body.rows.map(row => row[0])).toEqual(['Amsterdam', 'Berlin', 'Zurich']);
    });

    it('sorts date dimensions chronologically even when legacy config orders by measure', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadCsvDataset(
            orgId,
            ['date,score', '2025-12-18,1', '2025-09-26,3', '2025-09-27,2'].join('\n'),
            'dates.csv'
        );
        const dateId = await getColumnId(datasetId, 'date');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: dateId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
            orderBy: { ref: 'measure', index: 0, dir: 'desc' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<Array<string | number | null>> };
        expect(body.rows.map(row => row[0])).toEqual([
            '2025-09-26T00:00:00.000Z',
            '2025-09-27T00:00:00.000Z',
            '2025-12-18T00:00:00.000Z',
        ]);
    });

    it('sorts legacy string weekday dimensions from Monday to Sunday', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadWeekdayDataset(orgId);
        const weekdayId = await getColumnId(datasetId, 'weekday');
        const scoreId = await getColumnId(datasetId, 'score');

        await dbQuery(
            `UPDATE data.dataset_columns SET data_type = 'string' WHERE id = $1`,
            [weekdayId]
        );

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: weekdayId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<Array<string | number | null>> };
        expect(body.rows.map(row => row[0])).toEqual([
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
        ]);
    });

    it('skips rows missing required dimension or measure cells only', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadCsvDataset(
            orgId,
            [
                'city,score,comment',
                'Paris,10,ok',
                'Paris,,missing measure',
                ',20,missing city',
                'Berlin,5,',
            ].join('\n'),
            'sparse-required.csv'
        );
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<[string, number]> };
        expect(body.rows).toEqual([
            ['Berlin', 5],
            ['Paris', 10],
        ]);
    });

    it('skips a multi-measure row when any selected measure cell is empty', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadCsvDataset(
            orgId,
            ['city,revenue,cost', 'Paris,10,3', 'Paris,4,', 'Berlin,8,2'].join('\n'),
            'multi-measure-required.csv'
        );
        const cityId = await getColumnId(datasetId, 'city');
        const revenueId = await getColumnId(datasetId, 'revenue');
        const costId = await getColumnId(datasetId, 'cost');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [
                { columnId: revenueId, aggregate: 'sum' },
                { columnId: costId, aggregate: 'sum' },
            ],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<[string, number, number]> };
        expect(body.rows).toEqual([
            ['Berlin', 8, 2],
            ['Paris', 10, 3],
        ]);
    });

    it('continues to evaluate saved charts after a referenced column is disabled', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: cityId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
        });

        await dbQuery(
            `UPDATE data.dataset_columns SET is_analyzable = false WHERE id = $1`,
            [scoreId]
        );

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<unknown> };
        expect(body.rows.length).toBeGreaterThan(0);
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
            dimension: {
                columnId: dateId,
                grouping: { kind: 'time', granularity: 'day' },
            },
            measures: [{ columnId: scoreId, aggregate: 'avg' }],
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            kind: string;
            columns: Array<{ timeGranularity?: string }>;
            rows: unknown[];
        };
        expect(body.kind).toBe('line');
        expect(body.columns[0].timeGranularity).toBe('day');
        expect(body.rows.length).toBeGreaterThan(0);
    });

    it('sorts line dimensions chronologically even when legacy config orders by measure', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadCsvDataset(
            orgId,
            ['date,score', '2025-12-18,1', '2025-09-26,3', '2025-09-27,2'].join('\n'),
            'line-dates.csv'
        );
        const dateId = await getColumnId(datasetId, 'date');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'line',
            dimension: { columnId: dateId },
            measures: [{ columnId: scoreId, aggregate: 'sum' }],
            orderBy: { ref: 'measure', index: 0, dir: 'desc' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<Array<string | number | null>> };
        expect(body.rows.map(row => row[0])).toEqual([
            '2025-09-26T00:00:00.000Z',
            '2025-09-27T00:00:00.000Z',
            '2025-12-18T00:00:00.000Z',
        ]);
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

    it('sorts day_of_week heatmap axes from Monday to Sunday', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadWeekdayDataset(orgId);
        const weekdayId = await getColumnId(datasetId, 'weekday');
        const shopId = await getColumnId(datasetId, 'shop');
        const scoreId = await getColumnId(datasetId, 'score');

        const chartId = await createChart(orgId, datasetId, {
            kind: 'heatmap',
            x: { columnId: weekdayId },
            y: { columnId: shopId },
            measure: { columnId: scoreId, aggregate: 'sum' },
        });

        const res = await api(`/api/charts/${chartId}/data`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<Array<string | number | null>> };
        expect([...new Set(body.rows.map(row => row[0]))]).toEqual([
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
        ]);
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
