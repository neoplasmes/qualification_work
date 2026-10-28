import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { dashboardChartDefaultHeight, type Dashboard } from '@qualification-work/types';

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

describe('DELETE /api/dashboards/:id/items/:itemId', () => {
    it('204 + item disappears, others keep posY', async () => {
        const dashboardId = await createDashboard(orgId);
        const firstId = await addChartItem(dashboardId, chartId);
        const secondId = await addChartItem(dashboardId, chartId);

        const del = await api(`/api/dashboards/${dashboardId}/items/${firstId}`, {
            method: 'DELETE',
        });
        expect(del.status).toBe(204);

        const dashboard = (await (
            await api(`/api/dashboards/${dashboardId}`)
        ).json()) as Dashboard;
        expect(dashboard.items).toHaveLength(1);
        expect(dashboard.items[0].id).toBe(secondId);
        expect(dashboard.items[0].layout.posY).toBe(dashboardChartDefaultHeight);
    });

    it('404 when item does not belong to dashboard', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items/${randomUUID()}`, {
            method: 'DELETE',
        });
        expect(res.status).toBe(404);
    });

    it('204 for editor in org', async () => {
        const dashboardId = await createDashboard(orgId);
        const itemId = await addChartItem(dashboardId, chartId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}/items/${itemId}`,
            { method: 'DELETE' }
        );
        expect(res.status).toBe(204);

        const dashboard = (await (
            await apiAs(
                dashboardIdentity(userId, orgId, 'editor'),
                `/api/dashboards/${dashboardId}`
            )
        ).json()) as Dashboard;
        expect(dashboard.items).toEqual([]);
    });

    it('404 for viewer in org and item remains', async () => {
        const dashboardId = await createDashboard(orgId);
        const itemId = await addChartItem(dashboardId, chartId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}/items/${itemId}`,
            { method: 'DELETE' }
        );
        expect(res.status).toBe(404);

        const dashboard = (await (
            await apiAs(
                dashboardIdentity(userId, orgId, 'viewer'),
                `/api/dashboards/${dashboardId}`
            )
        ).json()) as Dashboard;
        expect(dashboard.items).toHaveLength(1);
        expect(dashboard.items[0].id).toBe(itemId);
    });
});
