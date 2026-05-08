import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { createChart, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('POST /api/charts', () => {
    it('creates a chart and returns its id', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const id = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        expect(typeof id).toBe('string');
        expect(id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });

    it('returns 400 when required fields are missing', async () => {
        const { api } = await import('../setup');
        const res = await api('/api/charts', {
            method: 'POST',
            body: JSON.stringify({ name: 'oops' }),
        });
        expect(res.status).toBe(400);
    });
});
