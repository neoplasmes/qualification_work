import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Dashboard } from '@qualification-work/types';

import { api, apiAs, resetTestIdentity, startServer, stopServer, truncate } from '../lib';
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

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    ({ userId, orgId, chartId } = await bootFixture());
    silenceErrors();
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('PATCH /api/dashboards/:id/items/order', () => {
    it('204 + order changes', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const patch = await api(`/api/dashboards/${dashboardId}/items/order`, {
            method: 'PATCH',
            body: JSON.stringify({
                order: [
                    { itemId: a, posY: 1 },
                    { itemId: b, posY: 0 },
                ],
            }),
        });
        expect(patch.status).toBe(204);

        const dashboard = (await (
            await api(`/api/dashboards/${dashboardId}`)
        ).json()) as Dashboard;
        expect(dashboard.items.map(i => i.id)).toEqual([b, a]);
    });

    it('400 when order references foreign item', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items/order`, {
            method: 'PATCH',
            body: JSON.stringify({
                order: [{ itemId: randomUUID(), posY: 0 }],
            }),
        });
        expect(res.status).toBe(400);
    });

    it('204 for editor in org', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}/items/order`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    order: [
                        { itemId: a, posY: 1 },
                        { itemId: b, posY: 0 },
                    ],
                }),
            }
        );
        expect(res.status).toBe(204);

        const dashboard = (await (
            await apiAs(
                dashboardIdentity(userId, orgId, 'editor'),
                `/api/dashboards/${dashboardId}`
            )
        ).json()) as Dashboard;
        expect(dashboard.items.map(i => i.id)).toEqual([b, a]);
    });

    it('404 for viewer in org and order remains', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}/items/order`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    order: [
                        { itemId: a, posY: 1 },
                        { itemId: b, posY: 0 },
                    ],
                }),
            }
        );
        expect(res.status).toBe(404);

        const dashboard = (await (
            await apiAs(
                dashboardIdentity(userId, orgId, 'viewer'),
                `/api/dashboards/${dashboardId}`
            )
        ).json()) as Dashboard;
        expect(dashboard.items.map(i => i.id)).toEqual([a, b]);
    });

    it('400 on duplicate posY', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const res = await api(`/api/dashboards/${dashboardId}/items/order`, {
            method: 'PATCH',
            body: JSON.stringify({
                order: [
                    { itemId: a, posY: 0 },
                    { itemId: b, posY: 0 },
                ],
            }),
        });
        expect(res.status).toBe(400);
    });
});
