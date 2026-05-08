import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('DELETE /api/datasets/:id', () => {
    it('deletes the dataset and returns 204', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const res = await api(`/api/datasets/${datasetId}`, { method: 'DELETE' });
        expect(res.status).toBe(204);

        const check = await api(`/api/datasets/${datasetId}/metadata`);
        expect(check.status).toBe(404);
    });

    it('returns 204 for unknown id (silent noop)', async () => {
        const res = await api('/api/datasets/00000000-0000-0000-0000-000000000000', {
            method: 'DELETE',
        });
        expect(res.status).toBe(204);
    });
});
