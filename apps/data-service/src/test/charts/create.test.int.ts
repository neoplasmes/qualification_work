import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { createChart, getColumnId, uploadDataset } from './lib';

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
        const res = await api('/api/charts', {
            method: 'POST',
            body: JSON.stringify({ name: 'oops' }),
        });
        expect(res.status).toBe(400);
    });

    it('rejects configs that use disabled analysis columns', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId);
        const cityId = await getColumnId(datasetId, 'city');
        const scoreId = await getColumnId(datasetId, 'score');

        await dbQuery(
            `UPDATE data.dataset_columns SET is_analyzable = false WHERE id = $1`,
            [cityId]
        );

        const res = await api('/api/charts', {
            method: 'POST',
            body: JSON.stringify({
                orgId,
                datasetId,
                name: 'blocked chart',
                chartType: 'bar',
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
