import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api, startServer, stopServer, truncate } from './setup';

const user = {
    email: 'datasets-get@example.com',
    password: 'password123',
    name: 'John',
    family: 'Doe',
};

const mimeType = {
    csv: 'text/csv',
} as const;

type MeResponse = {
    organizations: Array<{ id: string }>;
};

const assetsDir = path.resolve(import.meta.dirname, 'assets');

async function registerAndLogin(): Promise<{ cookie: string; orgId: string }> {
    await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(user),
    });

    const loginRes = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const cookie = loginRes.headers.get('set-cookie');

    if (!cookie) {
        throw new Error('Missing auth cookie in tests');
    }

    const meRes = await api('/api/auth/me', {
        headers: { cookie },
    });
    const meBody = (await meRes.json()) as MeResponse;

    return {
        cookie,
        orgId: meBody.organizations[0].id,
    };
}

async function uploadDataset(orgId: string, cookie: string): Promise<string> {
    const fileName = 'datasetBasic.csv';
    const fileBuffer = await readFile(path.join(assetsDir, fileName));
    const formData = new FormData();

    formData.append('file', new Blob([fileBuffer], { type: mimeType.csv }), fileName);

    const res = await api(`/api/datasets?orgId=${orgId}`, {
        method: 'POST',
        body: formData,
        headers: { cookie },
    });

    expect(res.status).toBe(201);

    const body = (await res.json()) as { id: string };

    return body.id;
}

beforeAll(startServer);
afterAll(stopServer);

afterEach(truncate);

describe('GET /api/datasets/:id/metadata', () => {
    it('returns dataset metadata, columns and totalRows without rows payload', async () => {
        const { cookie, orgId } = await registerAndLogin();
        const datasetId = await uploadDataset(orgId, cookie);

        const res = await api(`/api/datasets/${datasetId}/metadata`, {
            headers: { cookie },
        });
        expect(res.status).toBe(200);

        const response = (await res.json()) as {
            dataset: {
                id: string;
                orgId: string;
                name: string;
                sourceType: 'csv' | 'xlsx' | 'manual';
                createdAt: string;
                updatedAt: string;
            };
            columns: Array<{
                id: string;
                datasetId: string;
                key: string;
                displayName: string;
                dataType: 'number' | 'string' | 'date' | 'bool';
                orderIndex: number;
            }>;
            totalRows: number;
        };

        expect(response.dataset.id).toBe(datasetId);
        expect(response.dataset.orgId).toBe(orgId);
        expect(response.dataset.name).toBe('datasetBasic');
        expect(response.dataset.sourceType).toBe('csv');
        expect(response.totalRows).toBe(22);
        expect(response.columns).toHaveLength(8);
        expect(response.columns.map(column => column.key)).toEqual([
            'id',
            'name',
            'age',
            'active',
            'city',
            'country',
            'score',
            'signupDate',
        ]);
        expect(response).not.toHaveProperty('rows');
    });
});

describe('GET /api/datasets?orgId=<org_id>', () => {
    it('returns metadata for all datasets in the organization', async () => {
        const { cookie, orgId } = await registerAndLogin();
        const firstDatasetId = await uploadDataset(orgId, cookie);
        const secondDatasetId = await uploadDataset(orgId, cookie);

        const res = await api(`/api/datasets?orgId=${orgId}`, {
            headers: { cookie },
        });
        expect(res.status).toBe(200);

        const response = (await res.json()) as Array<{
            dataset: {
                id: string;
                orgId: string;
                name: string;
                sourceType: 'csv' | 'xlsx' | 'manual';
                createdAt: string;
                updatedAt: string;
            };
            columns: Array<{
                id: string;
                datasetId: string;
                key: string;
                displayName: string;
                dataType: 'number' | 'string' | 'date' | 'bool';
                orderIndex: number;
            }>;
            totalRows: number;
        }>;

        expect(response).toHaveLength(2);
        expect(response.map(item => item.dataset.id).sort()).toEqual(
            [firstDatasetId, secondDatasetId].sort()
        );
        expect(response.every(item => item.dataset.orgId === orgId)).toBe(true);
        expect(response.every(item => item.totalRows === 22)).toBe(true);
        expect(response.every(item => item.columns.length === 8)).toBe(true);
        expect(
            response.every(item => item.columns[0]?.datasetId === item.dataset.id)
        ).toBe(true);
    });
});

describe('GET /api/datasets/:id/rows', () => {
    it('returns paginated dataset rows for tabular view', async () => {
        const { cookie, orgId } = await registerAndLogin();
        const datasetId = await uploadDataset(orgId, cookie);

        const res = await api(`/api/datasets/${datasetId}/rows?offset=5&limit=3`, {
            headers: { cookie },
        });
        expect(res.status).toBe(200);

        const response = (await res.json()) as {
            rows: Array<{
                id: string;
                datasetId: string;
                rowIndex: number;
                data: Record<string, unknown>;
            }>;
            totalRows: number;
            offset: number;
            limit: number;
        };

        expect(response.totalRows).toBe(22);
        expect(response.offset).toBe(5);
        expect(response.limit).toBe(3);
        expect(response.rows).toHaveLength(3);
        expect(response.rows.map(row => row.rowIndex)).toEqual([5, 6, 7]);
        expect(response.rows[0].data).toEqual({
            id: '6',
            name: 'Fiona Green',
            age: '27',
            active: 'true',
            city: 'Vienna',
            country: 'Austria',
            score: '89',
            signupDate: '2024-01-15',
        });
    });
});
