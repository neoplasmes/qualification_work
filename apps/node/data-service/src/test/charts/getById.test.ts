import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { createChart, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('GET /api/charts/:id', () => {
    it('returns the chart', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        const res = await api(`/api/charts/${chartId}`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { id: string; orgId: string; name: string };
        expect(body.id).toBe(chartId);
        expect(body.orgId).toBe(orgId);
        expect(body.name).toBe('test chart');
    });

    it('returns 404 for unknown id', async () => {
        const res = await api('/api/charts/00000000-0000-0000-0000-000000000000');
        expect(res.status).toBe(404);
    });
});
