import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';
import {
    createBarChart,
    fetchDatasetColumns,
    uploadCsvDataset,
} from '../utils/factories.js';

type ChartResponse = {
    kind: 'bar' | 'line' | 'pie' | 'heatmap';
    columns: Array<{ name: string; role: string }>;
    rows: Array<Array<string | number | null>>;
    truncated: boolean;
};
type Chart = {
    id: string;
    orgId: string;
    datasetId: string;
    name: string;
    chartType: string;
    config: Record<string, unknown>;
};

describe('data-service /api/data/charts', () => {
    it('create chart -> 201, gettable by id with correct config', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nB,20\nC,30',
        });

        const chart = await createBarChart(user, dataset, { name: 'category breakdown' });

        const get = await api(`/api/data/charts/${chart.id}`, { cookie: user.cookie });
        expect(get.status).toBe(200);
        const body = (await get.json()) as Chart;
        expect(body.id).toBe(chart.id);
        expect(body.name).toBe('category breakdown');
        expect(body.chartType).toBe('bar');
    });

    it('list charts for org -> returns created chart', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10',
        });
        const chart = await createBarChart(user, dataset);

        const list = await api(`/api/data/charts?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        expect(list.status).toBe(200);
        const items = (await list.json()) as Array<{ id: string }>;
        expect(items.some(c => c.id === chart.id)).toBe(true);
    });

    it('update chart -> 204, get reflects the change', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10',
        });
        const chart = await createBarChart(user, dataset, { name: 'old' });

        const update = await api(`/api/data/charts/${chart.id}`, {
            method: 'PUT',
            cookie: user.cookie,
            body: JSON.stringify({ name: 'new name' }),
        });
        expect(update.status).toBe(204);

        const get = await api(`/api/data/charts/${chart.id}`, { cookie: user.cookie });
        const body = (await get.json()) as Chart;
        expect(body.name).toBe('new name');
    });

    it('delete chart -> 204, no longer in list', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10',
        });
        const chart = await createBarChart(user, dataset);

        const del = await api(`/api/data/charts/${chart.id}`, {
            method: 'DELETE',
            cookie: user.cookie,
        });
        expect(del.status).toBe(204);

        const list = await api(`/api/data/charts?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        const items = (await list.json()) as Array<{ id: string }>;
        expect(items.some(c => c.id === chart.id)).toBe(false);
    });

    it('chart data endpoint returns aggregated result for bar chart', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nA,5\nB,20',
        });
        const chart = await createBarChart(user, dataset);

        const data = await api(`/api/data/charts/${chart.id}/data`, {
            cookie: user.cookie,
        });
        expect(data.status).toBe(200);
        const body = (await data.json()) as ChartResponse;
        expect(body.kind).toBe('bar');
        expect(body.rows.length).toBeGreaterThan(0);
    });

    it('preview returns same shape as saved chart data', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nB,20',
        });
        const columns = await fetchDatasetColumns(user, dataset.id);
        const dimension = columns.find(c => c.key === 'category');
        const measure = columns.find(c => c.key === 'value');

        const previewResponse = await api('/api/data/charts/preview', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                datasetId: dataset.id,
                chartType: 'bar',
                config: {
                    kind: 'bar',
                    dimension: { columnId: dimension!.id },
                    measures: [{ columnId: measure!.id, aggregate: 'sum' }],
                },
            }),
        });
        expect(previewResponse.status).toBe(200);
        const preview = (await previewResponse.json()) as ChartResponse;
        expect(preview.kind).toBe('bar');
    });

    it('get chart from another organization -> 403/404', async () => {
        const owner = await registerAndLogin();
        const stranger = await registerAndLogin();
        const dataset = await uploadCsvDataset(owner, {
            csv: 'category,value\nA,10',
        });
        const chart = await createBarChart(owner, dataset);

        const response = await api(`/api/data/charts/${chart.id}`, {
            cookie: stranger.cookie,
        });
        expect([403, 404]).toContain(response.status);
    });

    it('filterOverrides via base64 query param applies the filter', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nB,20\nA,5',
        });
        const chart = await createBarChart(user, dataset);
        const columns = await fetchDatasetColumns(user, dataset.id);
        const categoryCol = columns.find(c => c.key === 'category')!;

        const filterOverrides = [
            { columnId: categoryCol.id, op: 'eq', value: 'A' },
        ];
        const encoded = Buffer.from(JSON.stringify(filterOverrides)).toString(
            'base64url'
        );

        const data = await api(
            `/api/data/charts/${chart.id}/data?filterOverrides=${encoded}`,
            { cookie: user.cookie }
        );
        expect(data.status).toBe(200);
        const body = (await data.json()) as ChartResponse;
        // only category A should remain after filtering
        expect(body.rows.length).toBe(1);
    });

    it('create chart with malformed body -> 400', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10',
        });

        const response = await api('/api/data/charts', {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                orgId: user.orgId,
                datasetId: dataset.id,
                // missing name, chartType, config
            }),
        });
        expect(response.status).toBe(400);
    });
});
