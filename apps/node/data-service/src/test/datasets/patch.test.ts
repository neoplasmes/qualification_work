import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('PATCH /api/datasets/:id', () => {
    it('renames dataset and returns 204', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const patch = await api(`/api/datasets/${datasetId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'renamed dataset' }),
        });

        expect(patch.status).toBe(204);

        const metadata = await api(`/api/datasets/${datasetId}/metadata`);
        const body = await metadata.json();

        expect(body).toMatchObject({
            dataset: {
                id: datasetId,
                name: 'renamed dataset',
            },
        });
    });

    it('rejects empty patch body', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);

        const patch = await api(`/api/datasets/${datasetId}`, {
            method: 'PATCH',
            body: JSON.stringify({}),
        });

        expect(patch.status).toBe(422);
    });
});
