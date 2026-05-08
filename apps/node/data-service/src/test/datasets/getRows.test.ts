import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('GET /api/datasets/:id/rows', () => {
    it('returns rows page for an uploaded dataset', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/rows`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toMatchObject({
            rows: expect.any(Array),
            totalRows: expect.any(Number),
        });
        expect((body as { rows: unknown[] }).rows.length).toBeGreaterThan(0);
    });

    it('respects limit param', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/rows?limit=1&offset=0`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect((body as { rows: unknown[] }).rows).toHaveLength(1);
    });

    it('returns 404 for unknown id', async () => {
        const res = await api('/api/datasets/00000000-0000-0000-0000-000000000000/rows');
        expect(res.status).toBe(404);
    });
});
