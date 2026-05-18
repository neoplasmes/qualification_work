import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Dashboard } from '@qualification-work/types';

import { api, apiAs, resetTestIdentity, startServer, stopServer, truncate } from '../lib';
import { bootFixture, createDashboard, dashboardIdentity, silenceErrors } from './lib';

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

describe('POST /api/dashboards/:id/items', () => {
    it('chart-item: posY=0, posY=1', async () => {
        const dashboardId = await createDashboard(orgId);

        const first = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'chart', chartId }),
        });
        expect(first.status).toBe(201);
        expect(((await first.json()) as { posY: number }).posY).toBe(0);

        const second = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'chart', chartId }),
        });
        expect(second.status).toBe(201);
        expect(((await second.json()) as { posY: number }).posY).toBe(1);
    });

    it('metric-item with valid format', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'AOV',
                expression: 'avg(amount)',
                format: 'currency',
            }),
        });
        expect(res.status).toBe(201);
    });

    it('201 for editor in org', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'editor'),
            `/api/dashboards/${dashboardId}/items`,
            {
                method: 'POST',
                body: JSON.stringify({ kind: 'chart', chartId }),
            }
        );

        expect(res.status).toBe(201);
    });

    it('404 for viewer in org and items remain unchanged', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}/items`,
            {
                method: 'POST',
                body: JSON.stringify({ kind: 'chart', chartId }),
            }
        );
        expect(res.status).toBe(404);

        const get = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards/${dashboardId}`
        );
        const body = (await get.json()) as Dashboard;
        expect(body.items).toEqual([]);
    });

    it('404 when dashboardId does not exist', async () => {
        const res = await api(`/api/dashboards/${randomUUID()}/items`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'chart', chartId }),
        });
        expect(res.status).toBe(404);
    });

    it('404 when chartId does not exist', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'chart', chartId: randomUUID() }),
        });
        expect(res.status).toBe(404);
    });

    it('400 on unknown kind', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'image', chartId }),
        });
        expect(res.status).toBe(400);
    });

    it('400 on broken metric format', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'metric',
                datasetId,
                name: 'x',
                expression: '1',
                format: 'string',
            }),
        });
        expect(res.status).toBe(400);
    });

    it('server ignores posX/width from body', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(`/api/dashboards/${dashboardId}/items`, {
            method: 'POST',
            body: JSON.stringify({
                kind: 'chart',
                chartId,
                posX: 999,
                width: 1,
            }),
        });
        expect(res.status).toBe(201);

        const get = await api(`/api/dashboards/${dashboardId}`);
        const body = (await get.json()) as Dashboard;
        expect(body.items[0].layout.posX).toBe(0);
        expect(body.items[0].layout.width).toBe(12);
    });
});
