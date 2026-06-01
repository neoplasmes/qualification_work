import { delay } from 'es-toolkit';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
    dashboardChartDefaultWidth,
    dashboardChartMinHeight,
    dashboardMetricDefaultHeight,
    dashboardMetricDefaultWidth,
    type Dashboard,
} from '@qualification-work/types';

import { api, resetTestIdentity, startServer, stopServer, truncate } from '../lib';
import { addChartItem, bootFixture, createDashboard, silenceErrors } from './lib';

let orgId: string;
let chartId: string;
let datasetId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    ({ orgId, chartId, datasetId } = await bootFixture());
    silenceErrors();
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('сквозной сценарий жизни дашборда', () => {
    it('create -> add chart + metric -> rename -> layout -> remove -> delete', async () => {
        const dashboardId = await createDashboard(orgId, 'Sales');

        const chartItemId = await addChartItem(dashboardId, chartId);

        const metricRes = await api(`/api/dashboards/${dashboardId}/items`, {
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
        const metricItemId = ((await metricRes.json()) as { itemId: string }).itemId;

        await api(`/api/dashboards/${dashboardId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'Sales Q2' }),
        });

        await api(`/api/dashboards/${dashboardId}/items/layout`, {
            method: 'PATCH',
            body: JSON.stringify({
                layout: [
                    {
                        itemId: metricItemId,
                        posX: 0,
                        posY: 0,
                        width: dashboardMetricDefaultWidth,
                        height: dashboardMetricDefaultHeight,
                    },
                    {
                        itemId: chartItemId,
                        posX: 0,
                        posY: dashboardMetricDefaultHeight,
                        width: dashboardChartDefaultWidth,
                        height: dashboardChartMinHeight,
                    },
                ],
            }),
        });

        const afterLayout = (await (
            await api(`/api/dashboards/${dashboardId}`)
        ).json()) as Dashboard;
        expect(afterLayout.name).toBe('Sales Q2');
        expect(afterLayout.items.map(i => i.id)).toEqual([metricItemId, chartItemId]);

        await api(`/api/dashboards/${dashboardId}/items/${metricItemId}`, {
            method: 'DELETE',
        });

        const afterRemove = (await (
            await api(`/api/dashboards/${dashboardId}`)
        ).json()) as Dashboard;
        expect(afterRemove.items).toHaveLength(1);
        expect(afterRemove.items[0].id).toBe(chartItemId);

        await api(`/api/dashboards/${dashboardId}`, { method: 'DELETE' });

        const finalGet = await api(`/api/dashboards/${dashboardId}`);
        expect(finalGet.status).toBe(404);
    });

    it('listing shows all org dashboards sorted by createdAt', async () => {
        await createDashboard(orgId, 'one');
        await delay(10);
        await createDashboard(orgId, 'two');
        await delay(10);
        await createDashboard(orgId, 'three');

        const list = (await (
            await api(`/api/dashboards?orgId=${orgId}`)
        ).json()) as Array<{ name: string }>;

        expect(list.map(d => d.name)).toEqual(['three', 'two', 'one']);
    });
});
