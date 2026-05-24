import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { getColumnId, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('POST /api/charts/preview - bar', () => {
    it('returns aggregated data without persisting a chart', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        const res = await api('/api/charts/preview', {
            method: 'POST',
            body: JSON.stringify({
                datasetId,
                chartType: 'bar',
                config: {
                    kind: 'bar',
                    dimension: { columnId: cityId },
                    measures: [{ columnId: scoreId, aggregate: 'avg' }],
                },
            }),
        });

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
    });
});

describe('POST /api/charts/preview - pie', () => {
    it('returns pie slices', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const countryId = await getColumnId(datasetId, 'country');
        const scoreId = await getColumnId(datasetId, 'score');

        const res = await api('/api/charts/preview', {
            method: 'POST',
            body: JSON.stringify({
                datasetId,
                chartType: 'pie',
                config: {
                    kind: 'pie',
                    slice: { columnId: countryId },
                    measure: { columnId: scoreId, aggregate: 'sum' },
                },
            }),
        });

        expect(res.status).toBe(200);

        const body = (await res.json()) as { kind: string; rows: unknown[] };
        expect(body.kind).toBe('pie');
        expect(body.rows.length).toBeGreaterThan(0);
    });
});

describe('POST /api/charts/preview - filterOverrides', () => {
    it('applies filterOverrides to preview results', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');
        const countryId = await getColumnId(datasetId, 'country');

        const res = await api('/api/charts/preview', {
            method: 'POST',
            body: JSON.stringify({
                datasetId,
                chartType: 'bar',
                config: {
                    kind: 'bar',
                    dimension: { columnId: cityId },
                    measures: [{ columnId: scoreId, aggregate: 'sum' }],
                },
                filterOverrides: [{ columnId: countryId, op: 'eq', value: 'France' }],
            }),
        });

        expect(res.status).toBe(200);

        const body = (await res.json()) as { rows: Array<[string, number | null]> };
        expect(body.rows).toHaveLength(1);
        expect(body.rows[0][0]).toBe('Paris');
    });
});

describe('POST /api/charts/preview - errors', () => {
    it('returns 404 for unknown datasetId', async () => {
        const res = await api('/api/charts/preview', {
            method: 'POST',
            body: JSON.stringify({
                datasetId: '00000000-0000-0000-0000-000000000000',
                chartType: 'bar',
                config: { kind: 'bar', dimension: { columnId: 'x' }, measures: [] },
            }),
        });

        expect(res.status).toBe(404);
    });

    it('returns 400 for invalid body', async () => {
        const res = await api('/api/charts/preview', {
            method: 'POST',
            body: JSON.stringify({ chartType: 'bar' }),
        });

        expect(res.status).toBe(400);
    });
});
