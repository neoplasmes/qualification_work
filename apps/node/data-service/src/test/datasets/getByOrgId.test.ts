import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, createTestUserWithOrg, startServer, stopServer, truncate } from '../setup';
import { uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('GET /api/datasets', () => {
    it('returns datasets for an org', async () => {
        const { orgId } = await createTestUserWithOrg();
        await uploadDataset(orgId);
        await uploadDataset(orgId);

        const res = await api(`/api/datasets?orgId=${orgId}`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(2);
    });

    it('returns empty array when org has no datasets', async () => {
        const { orgId } = await createTestUserWithOrg();

        const res = await api(`/api/datasets?orgId=${orgId}`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    it('returns 400 when orgId is missing', async () => {
        const res = await api('/api/datasets');
        expect(res.status).toBe(400);
    });
});
