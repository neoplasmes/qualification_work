import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';
import { uploadCsvDataset } from '../utils/factories.js';

type ColumnMeta = {
    key: string;
    displayName: string;
    dataType: 'number' | 'string' | 'date' | 'bool';
    orderIndex: number;
};
type DatasetMeta = {
    dataset: { id: string; orgId: string; name: string; sourceType: string };
    columns: ColumnMeta[];
};
type RowsPage = {
    rows: Array<{ id: string; rowIndex: number; data: Record<string, unknown> }>;
    total?: number;
};

describe('data-service /api/data/datasets', () => {
    it('upload csv -> 201, dataset visible in list', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'category,value\nA,10\nB,20\nC,30',
            filename: 'sales.csv',
        });

        const list = await api(`/api/data/datasets?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        expect(list.status).toBe(200);
        // list returns DatasetMetadata[] = [{ dataset, columns, totalRows }]
        const items = (await list.json()) as Array<{ dataset: { id: string } }>;
        expect(items.some(d => d.dataset.id === dataset.id)).toBe(true);
    });

    it('infers column types from sample data', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'name,age,active,joined\nAlice,30,true,2024-01-15\nBob,25,false,2024-03-22',
        });

        const metaResponse = await api(`/api/data/datasets/${dataset.id}/metadata`, {
            cookie: user.cookie,
        });
        expect(metaResponse.status).toBe(200);
        const meta = (await metaResponse.json()) as DatasetMeta;

        const byKey = new Map(meta.columns.map(c => [c.key, c.dataType]));
        expect(byKey.get('name')).toBe('string');
        expect(byKey.get('age')).toBe('number');
        expect(byKey.get('active')).toBe('bool');
        expect(byKey.get('joined')).toBe('date');
    });

    it('get rows with pagination -> 200', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv:
                'id,name\n' +
                Array.from({ length: 12 }, (_, i) => `${i + 1},user-${i + 1}`).join('\n'),
        });

        const page1 = await api(
            `/api/data/datasets/${dataset.id}/rows?offset=0&limit=5`,
            { cookie: user.cookie }
        );
        expect(page1.status).toBe(200);
        const body1 = (await page1.json()) as RowsPage;
        expect(body1.rows.length).toBe(5);

        const page2 = await api(
            `/api/data/datasets/${dataset.id}/rows?offset=5&limit=5`,
            { cookie: user.cookie }
        );
        const body2 = (await page2.json()) as RowsPage;
        expect(body2.rows.length).toBe(5);
        expect(body2.rows[0].rowIndex).not.toBe(body1.rows[0].rowIndex);
    });

    it('insert row -> 201, row appears in rows', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'name,age\nAlice,30',
        });

        const insert = await api(`/api/data/datasets/${dataset.id}/rows?orgId=${user.orgId}`, {
            method: 'POST',
            cookie: user.cookie,
            body: JSON.stringify({ data: { name: 'Bob', age: 25 } }),
        });
        expect(insert.status).toBe(201);

        const rows = await api(`/api/data/datasets/${dataset.id}/rows?offset=0&limit=10`, {
            cookie: user.cookie,
        });
        const body = (await rows.json()) as RowsPage;
        expect(body.rows.some(r => r.data.name === 'Bob')).toBe(true);
    });

    it('update row -> 200, new value persists', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'name,age\nAlice,30',
        });

        const rowsBefore = await api(`/api/data/datasets/${dataset.id}/rows`, {
            cookie: user.cookie,
        });
        const { rows } = (await rowsBefore.json()) as RowsPage;
        const aliceId = rows[0].id;

        const update = await api(
            `/api/data/datasets/${dataset.id}/rows/${aliceId}?orgId=${user.orgId}`,
            {
                method: 'PATCH',
                cookie: user.cookie,
                body: JSON.stringify({ values: { age: 31 } }),
            }
        );
        expect(update.status).toBe(200);

        const rowsAfter = await api(`/api/data/datasets/${dataset.id}/rows`, {
            cookie: user.cookie,
        });
        const { rows: rowsNew } = (await rowsAfter.json()) as RowsPage;
        const alice = rowsNew.find(r => r.id === aliceId);
        expect(alice?.data.age).toBe(31);
    });

    it('delete dataset -> 204, no longer in list', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'a,b\n1,2',
        });

        const del = await api(`/api/data/datasets/${dataset.id}`, {
            method: 'DELETE',
            cookie: user.cookie,
        });
        expect(del.status).toBe(204);

        const list = await api(`/api/data/datasets?orgId=${user.orgId}`, {
            cookie: user.cookie,
        });
        const items = (await list.json()) as Array<{ dataset: { id: string } }>;
        expect(items.some(d => d.dataset.id === dataset.id)).toBe(false);
    });

    it('upload with no file -> 400', async () => {
        const user = await registerAndLogin();
        const form = new FormData();

        const response = await api(`/api/data/datasets?orgId=${user.orgId}`, {
            method: 'POST',
            cookie: user.cookie,
            body: form,
        });
        expect(response.status).toBe(400);
    });

    it('get rows of dataset belonging to another org -> 403', async () => {
        const owner = await registerAndLogin();
        const stranger = await registerAndLogin();
        const dataset = await uploadCsvDataset(owner, { csv: 'a\n1' });

        const response = await api(`/api/data/datasets/${dataset.id}/rows`, {
            cookie: stranger.cookie,
        });
        expect(response.status).toBe(403);
    });

    it('get rows of nonexistent dataset -> 404', async () => {
        const user = await registerAndLogin();
        // valid UUID format but no such dataset
        const fakeId = '00000000-0000-4000-8000-000000000000';

        const response = await api(`/api/data/datasets/${fakeId}/rows`, {
            cookie: user.cookie,
        });
        expect([403, 404]).toContain(response.status);
    });
});
