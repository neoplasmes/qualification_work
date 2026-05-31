import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    type Dashboard,
} from '@qualification-work/types';

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

const layoutUrl = (dashboardId: string) => `/api/dashboards/${dashboardId}/items/layout`;

const at = (itemId: string, posY: number) => ({
    itemId,
    posX: 0,
    posY,
    width: dashboardChartMinWidth,
    height: dashboardChartMinHeight,
});

describe('PATCH /api/dashboards/:id/items/layout', () => {
    it('204 + persists the new layout', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const patch = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({
                layout: [
                    {
                        itemId: a,
                        posX: 6,
                        posY: 1,
                        width: dashboardChartMinWidth,
                        height: dashboardChartMinHeight,
                    },
                    at(b, 0),
                ],
            }),
        });
        expect(patch.status).toBe(204);

        const dashboard = (await (
            await api(`/api/dashboards/${dashboardId}`)
        ).json()) as Dashboard;
        expect(dashboard.items.map(i => i.id)).toEqual([b, a]);
        const movedA = dashboard.items.find(i => i.id === a);
        expect(movedA?.layout).toMatchObject({
            posX: 6,
            posY: 1,
            width: dashboardChartMinWidth,
            height: dashboardChartMinHeight,
        });
    });

    it('400 when layout references foreign item', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({
                layout: [at(randomUUID(), 0)],
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
            layoutUrl(dashboardId),
            {
                method: 'PATCH',
                body: JSON.stringify({
                    layout: [at(a, dashboardChartMinHeight), at(b, 0)],
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

    it('404 for viewer in org and layout remains', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            layoutUrl(dashboardId),
            {
                method: 'PATCH',
                body: JSON.stringify({
                    layout: [at(a, dashboardChartMinHeight), at(b, 0)],
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

    it('400 when an item does not fit the grid', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({
                layout: [
                    {
                        itemId: a,
                        posX: 8,
                        posY: 0,
                        width: 6,
                        height: dashboardChartMinHeight,
                    },
                ],
            }),
        });
        expect(res.status).toBe(400);
    });

    it('400 when layout omits an item', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        await addChartItem(dashboardId, chartId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({ layout: [at(a, 0)] }),
        });
        expect(res.status).toBe(400);
    });

    it('204 when an empty dashboard receives an empty layout snapshot', async () => {
        const dashboardId = await createDashboard(orgId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({ layout: [] }),
        });
        expect(res.status).toBe(204);
    });

    it('400 when an empty layout snapshot omits existing items', async () => {
        const dashboardId = await createDashboard(orgId);
        await addChartItem(dashboardId, chartId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({ layout: [] }),
        });
        expect(res.status).toBe(400);
    });

    it('400 when layout contains duplicate item ids', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({ layout: [at(a, 0), at(a, 1)] }),
        });
        expect(res.status).toBe(400);
    });

    it('400 when layout items overlap', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);
        const b = await addChartItem(dashboardId, chartId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({
                layout: [
                    { ...at(a, 0), posX: 0 },
                    { ...at(b, 0), posX: 2 },
                ],
            }),
        });
        expect(res.status).toBe(400);
    });

    it('400 when chart item is below its minimum size', async () => {
        const dashboardId = await createDashboard(orgId);
        const a = await addChartItem(dashboardId, chartId);

        const res = await api(layoutUrl(dashboardId), {
            method: 'PATCH',
            body: JSON.stringify({
                layout: [
                    {
                        itemId: a,
                        posX: 0,
                        posY: 0,
                        width: dashboardChartMinWidth - 1,
                        height: dashboardChartMinHeight,
                    },
                ],
            }),
        });
        expect(res.status).toBe(400);
    });
});
