import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
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

        expect(patch.status).toBe(400);
    });
});

describe('PATCH /api/datasets/:id/columns/:columnId', () => {
    it('toggles column analysis inclusion', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const [column] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_columns
             WHERE dataset_id = $1 AND key = 'name'`,
            [datasetId]
        );

        const patch = await api(
            `/api/datasets/${datasetId}/columns/${column.id}?orgId=${orgId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isAnalyzable: false }),
            }
        );

        expect(patch.status).toBe(200);
        const body = (await patch.json()) as { isAnalyzable: boolean };
        expect(body.isAnalyzable).toBe(false);

        const [stored] = await dbQuery<{ isAnalyzable: boolean }>(
            `SELECT is_analyzable AS "isAnalyzable"
             FROM data.dataset_columns
             WHERE id = $1`,
            [column.id]
        );
        expect(stored.isAnalyzable).toBe(false);
    });

    it('returns 403 when toggling a dataset from another org', async () => {
        const { orgId: ownerOrg } = await createTestUserWithOrg();
        const { orgId: outsiderOrg } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(ownerOrg);
        const [column] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_columns WHERE dataset_id = $1 LIMIT 1`,
            [datasetId]
        );

        const patch = await api(
            `/api/datasets/${datasetId}/columns/${column.id}?orgId=${outsiderOrg}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isAnalyzable: false }),
            }
        );

        expect(patch.status).toBe(403);
    });

    it('returns 404 when the column does not belong to the dataset', async () => {
        const { orgId } = await createTestUserWithOrg();
        const firstDatasetId = await uploadDataset(orgId);
        const secondDatasetId = await uploadDataset(orgId);
        const [column] = await dbQuery<{ id: string }>(
            `SELECT id FROM data.dataset_columns WHERE dataset_id = $1 LIMIT 1`,
            [secondDatasetId]
        );

        const patch = await api(
            `/api/datasets/${firstDatasetId}/columns/${column.id}?orgId=${orgId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isAnalyzable: false }),
            }
        );

        expect(patch.status).toBe(404);
    });
});
