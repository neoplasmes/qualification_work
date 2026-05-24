import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';
import {
    createBarChart,
    createDashboard,
    uploadCsvDataset,
} from '../utils/factories.js';

type DashboardItem = {
    id: string;
    kind: 'chart' | 'metric';
    layout: { posX: number; posY: number; width: number; height: number };
    chartId?: string;
};
type Dashboard = {
    id: string;
    orgId: string;
    name: string;
    items: DashboardItem[];
};

describe('server /api/dashboards', () => {
    it('create dashboard -> 201, returned in list and gettable by id', async () => {
        const user = await registerAndLogin();
        const dashboard = await createDashboard(user, { name: 'sales overview' });

        const listResponse = await api(`/api/dashboards?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        expect(listResponse.status).toBe(200);
        const list = (await listResponse.json()) as Array<{ id: string; name: string }>;
        expect(list.some(d => d.id === dashboard.id && d.name === 'sales overview')).toBe(
            true
        );

        const getResponse = await api(`/api/dashboards/${dashboard.id}`, {
            cookie: user.cookie,
        });
        expect(getResponse.status).toBe(200);
        const got = (await getResponse.json()) as Dashboard;
        expect(got.id).toBe(dashboard.id);
        expect(got.items).toEqual([]);
    });

    it('rename dashboard -> 204, get reflects the new name', async () => {
        const user = await registerAndLogin();
        const dashboard = await createDashboard(user, { name: 'initial' });

        const patch = await api(`/api/dashboards/${dashboard.id}`, {
            method: 'PATCH',
            cookie: user.cookie,
            body: JSON.stringify({ name: 'renamed' }),
        });
        expect(patch.status).toBe(204);

        const get = await api(`/api/dashboards/${dashboard.id}`, {
            cookie: user.cookie,
        });
        const got = (await get.json()) as Dashboard;
        expect(got.name).toBe('renamed');
    });

    it('add chart item to dashboard -> 201, listed in items', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nB,20',
        });
        const chart = await createBarChart(user, dataset);
        const dashboard = await createDashboard(user);

        const add = await api(`/api/dashboards/${dashboard.id}/items`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ kind: 'chart', chartId: chart.id }),
        });
        expect(add.status).toBe(201);
        const { itemId } = (await add.json()) as { itemId: string };
        expect(typeof itemId).toBe('string');

        const get = await api(`/api/dashboards/${dashboard.id}`, {
            cookie: user.cookie,
        });
        const got = (await get.json()) as Dashboard;
        expect(got.items.length).toBe(1);
        expect(got.items[0].kind).toBe('chart');
    });

    it('add metric item -> 201', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nB,20',
        });
        const dashboard = await createDashboard(user);

        const add = await api(`/api/dashboards/${dashboard.id}/items`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({
                kind: 'metric',
                datasetId: dataset.id,
                name: 'total value',
                expression: 'SUM(value)',
                format: 'number',
            }),
        });
        expect(add.status).toBe(201);
    });

    it('delete item -> 204, items list shrinks', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10',
        });
        const chart = await createBarChart(user, dataset);
        const dashboard = await createDashboard(user);

        const add = await api(`/api/dashboards/${dashboard.id}/items`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ kind: 'chart', chartId: chart.id }),
        });
        const { itemId } = (await add.json()) as { itemId: string };

        const del = await api(`/api/dashboards/${dashboard.id}/items/${itemId}`, {
            method: 'DELETE',
            cookie: user.cookie,
        });
        expect(del.status).toBe(204);

        const get = await api(`/api/dashboards/${dashboard.id}`, {
            cookie: user.cookie,
        });
        const got = (await get.json()) as Dashboard;
        expect(got.items.length).toBe(0);
    });

    it('reorder items -> 204, items reflect new posY', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10',
        });
        const chart1 = await createBarChart(user, dataset, { name: 'first' });
        const chart2 = await createBarChart(user, dataset, { name: 'second' });
        const dashboard = await createDashboard(user);

        const add1 = await api(`/api/dashboards/${dashboard.id}/items`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ kind: 'chart', chartId: chart1.id }),
        });
        const add2 = await api(`/api/dashboards/${dashboard.id}/items`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ kind: 'chart', chartId: chart2.id }),
        });
        const { itemId: id1 } = (await add1.json()) as { itemId: string };
        const { itemId: id2 } = (await add2.json()) as { itemId: string };

        const reorder = await api(`/api/dashboards/${dashboard.id}/items/order`, {
            method: 'PATCH',
            cookie: user.cookie,
            body: JSON.stringify({
                order: [
                    { itemId: id2, posY: 0 },
                    { itemId: id1, posY: 1 },
                ],
            }),
        });
        expect(reorder.status).toBe(204);

        const get = await api(`/api/dashboards/${dashboard.id}`, {
            cookie: user.cookie,
        });
        const got = (await get.json()) as Dashboard;
        const byId = new Map(got.items.map(i => [i.id, i.layout.posY]));
        expect(byId.get(id2)).toBe(0);
        expect(byId.get(id1)).toBe(1);
    });

    it('delete dashboard -> 204, no longer in list', async () => {
        const user = await registerAndLogin();
        const dashboard = await createDashboard(user, { name: 'doomed' });

        const del = await api(`/api/dashboards/${dashboard.id}`, {
            method: 'DELETE',
            cookie: user.cookie,
        });
        expect(del.status).toBe(204);

        const list = await api(`/api/dashboards?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        const items = (await list.json()) as Array<{ id: string }>;
        expect(items.some(d => d.id === dashboard.id)).toBe(false);
    });

    it('get dashboard from another organization -> 404', async () => {
        const ownerUser = await registerAndLogin();
        const stranger = await registerAndLogin();
        const dashboard = await createDashboard(ownerUser, { name: 'private' });

        const response = await api(`/api/dashboards/${dashboard.id}`, {
            cookie: stranger.cookie,
        });
        expect(response.status).toBe(404);
    });
});
