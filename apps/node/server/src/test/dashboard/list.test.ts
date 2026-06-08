import { randomUUID } from 'node:crypto';
import { delay } from 'es-toolkit';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { mockInternalIdentity } from '@qualification-work/microservice-utils/test-utils';
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

describe('GET /api/dashboards', () => {
    it('empty array for fresh org', async () => {
        const res = await api(`/api/dashboards?orgId=${orgId}`);

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    it('sorted by createdAt DESC', async () => {
        const firstId = await createDashboard(orgId, 'first');
        await delay(10);
        const secondId = await createDashboard(orgId, 'second');

        const res = await api(`/api/dashboards?orgId=${orgId}`);
        const body = (await res.json()) as Array<{ id: string }>;

        expect(body.map(d => d.id)).toEqual([secondId, firstId]);
    });

    it('returns dashboard items for list filters', async () => {
        const dashboardId = await createDashboard(orgId, 'with item');
        await addChartItem(dashboardId, chartId);

        const res = await api(`/api/dashboards?orgId=${orgId}`);
        const body = (await res.json()) as Dashboard[];

        expect(body[0]).toMatchObject({
            id: dashboardId,
            items: [{ kind: 'chart', chartId }],
        });
    });

    it('returns [] when orgId is not in membership (SQL filter)', async () => {
        await createDashboard(orgId, 'hidden');

        const stranger = mockInternalIdentity({
            orgs: [{ id: randomUUID(), role: 'owner' }],
        });

        const res = await apiAs(stranger, `/api/dashboards?orgId=${orgId}`);

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    it('returns dashboards for viewer in org', async () => {
        const dashboardId = await createDashboard(orgId, 'visible');

        const res = await apiAs(
            dashboardIdentity(userId, orgId, 'viewer'),
            `/api/dashboards?orgId=${orgId}`
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as Array<{ id: string }>;
        expect(body.map(d => d.id)).toEqual([dashboardId]);
    });
});
