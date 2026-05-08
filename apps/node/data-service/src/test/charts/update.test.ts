import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { createChart, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('PUT /api/charts/:id', () => {
    it('updates chart name and returns 204', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        const res = await api(`/api/charts/${chartId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: 'renamed' }),
        });
        expect(res.status).toBe(204);

        const check = await api(`/api/charts/${chartId}`);
        const body = (await check.json()) as { name: string };
        expect(body.name).toBe('renamed');
    });

    it('returns 204 for unknown id (silent noop)', async () => {
        const res = await api('/api/charts/00000000-0000-0000-0000-000000000000', {
            method: 'PUT',
            body: JSON.stringify({ name: 'x' }),
        });
        expect(res.status).toBe(204);
    });
});
