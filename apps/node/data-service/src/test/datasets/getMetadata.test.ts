import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('GET /api/datasets/:id/metadata', () => {
    it('returns metadata for an uploaded dataset', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}/metadata`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toMatchObject({
            dataset: {
                id: datasetId,
                orgId,
                name: 'datasetBasic',
                sourceType: 'csv',
            },
            columns: expect.any(Array),
            totalRows: expect.any(Number),
        });
        expect((body as { columns: unknown[] }).columns.length).toBeGreaterThan(0);
    });

    it('returns 404 for unknown id', async () => {
        const res = await api(
            '/api/datasets/00000000-0000-0000-0000-000000000000/metadata'
        );
        expect(res.status).toBe(404);
    });
});
