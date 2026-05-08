import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { createChart, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('GET /api/charts', () => {
    it('returns all charts for the org', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'c' },
            measures: [],
        });
        await createChart(orgId, datasetId, {
            kind: 'pie',
            slice: { columnId: 'c' },
            measure: { columnId: 'c', aggregate: 'count' },
        });

        const res = await api(`/api/charts?orgId=${orgId}`);
        expect(res.status).toBe(200);

        const body = (await res.json()) as { id: string }[];
        expect(body).toHaveLength(2);
    });

    it('returns empty array when org has no charts', async () => {
        const { orgId } = await createTestUserWithOrg();

        const res = await api(`/api/charts?orgId=${orgId}`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    });
});
