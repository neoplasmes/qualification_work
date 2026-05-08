import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { mimeType, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('POST /api/datasets', () => {
    it('uploads a CSV and returns dataset id', async () => {
        const { orgId } = await createTestUserWithOrg();
        const id = await uploadDataset(orgId);

        expect(typeof id).toBe('string');
        expect(id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });

    it('uploads an XLSX and returns dataset id', async () => {
        const { orgId } = await createTestUserWithOrg();
        const id = await uploadDataset(orgId, 'datasetBasic.xlsx', mimeType.xlsx);

        expect(typeof id).toBe('string');
    });

    it('returns 400 when orgId is missing', async () => {
        const form = new FormData();
        form.append('file', new Blob(['a,b\n1,2'], { type: mimeType.csv }), 'test.csv');

        const res = await api('/api/datasets', { method: 'POST', body: form });
        expect(res.status).toBe(400);
    });
});
