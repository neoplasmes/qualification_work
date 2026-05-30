import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { createChart, getColumnId, uploadDataset } from './helpers';

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

describe('PATCH /api/charts/:id', () => {
    it('patches chart name and returns 204', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        const res = await api(`/api/charts/${chartId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: 'patched chart' }),
        });
        expect(res.status).toBe(204);

        const check = await api(`/api/charts/${chartId}`);
        const body = (await check.json()) as { name: string };
        expect(body.name).toBe('patched chart');
    });

    it('rejects empty patch body', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        const res = await api(`/api/charts/${chartId}`, {
            method: 'PATCH',
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
    });

    it('rejects changed configs that use disabled analysis columns', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');
        const chartId = await createChart(orgId, datasetId, {
            kind: 'bar',
            dimension: { columnId: 'col' },
            measures: [],
        });

        await dbQuery(
            `UPDATE data.dataset_columns SET is_analyzable = false WHERE id = $1`,
            [scoreId]
        );

        const res = await api(`/api/charts/${chartId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                config: {
                    kind: 'bar',
                    dimension: { columnId: cityId },
                    measures: [{ columnId: scoreId, aggregate: 'sum' }],
                },
            }),
        });

        expect(res.status).toBe(400);
    });
});
