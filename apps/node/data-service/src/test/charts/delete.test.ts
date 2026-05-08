import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { createChart, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('DELETE /api/charts/:id', () => {
    it('deletes the chart and returns 204', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        const res = await api(`/api/charts/${chartId}`, { method: 'DELETE' });
        expect(res.status).toBe(204);

        const check = await api(`/api/charts/${chartId}`);
        expect(check.status).toBe(404);
    });

    it('returns 204 for unknown id (silent noop)', async () => {
        const res = await api('/api/charts/00000000-0000-0000-0000-000000000000', {
            method: 'DELETE',
        });
        expect(res.status).toBe(204);
    });
});
