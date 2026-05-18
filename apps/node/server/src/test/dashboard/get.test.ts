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
let datasetId: string;

beforeAll(startServer);
afterAll(stopServer);

beforeEach(async () => {
    ({ userId, orgId, chartId, datasetId } = await bootFixture());
    silenceErrors();
});

afterEach(async () => {
    resetTestIdentity();
    await truncate();
});

describe('GET /api/dashboards/:id', () => {
    it('returns DTO with empty items after create', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as Dashboard;
        expect(body.id).toBe(dashboardId);
        expect(body.orgId).toBe(orgId);
        expect(body.items).toEqual([]);
    });

    it('items ordered by posY + stack convention', async () => {
        const dashboardId = await createDashboard(orgId);

        await addChartItem(dashboardId, chartId);
        await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'Revenue',
                expression: 'sum(amount)',
                format: 'currency',
            }),
        });

        const res = await api(`/api/dashboards/${dashboardId}`);
        const body = (await res.json()) as Dashboard;

        expect(body.items).toHaveLength(2);
        expect(body.items[0].layout.posY).toBe(0);
        expect(body.items[1].layout.posY).toBe(1);
        expect(body.items[0].kind).toBe('chart');
        expect(body.items[1].kind).toBe('metric');
        expect(body.items[0].layout.posX).toBe(0);
        expect(body.items[0].layout.width).toBe(12);
    });

    it('404 for non-existent id', async () => {
        const res = await api(`/api/dashboards/${randomUUID()}`);
        expect(res.status).toBe(404);
    });

    it('200 for viewer in org', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as Dashboard;
        expect(body.id).toBe(dashboardId);
    });
});
