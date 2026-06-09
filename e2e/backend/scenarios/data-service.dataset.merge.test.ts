import { describe, expect, it } from 'vitest';

import { api } from '../utils/api.js';
import { registerAndLogin } from '../utils/auth.js';
import { uploadCsvDataset } from '../utils/factories.js';

type MergePreview = {
    sessionId: string;
    expiresInMs: number;
    statistics: {
        totalFiles: number;
        totalIncomingRows: number;
        totalNewRows: number;
        totalDuplicateRows: number;
        existingRowCount: number;
        newColumns: Array<{ key: string; dataType: string }>;
        commonColumns: string[];
    };
    conflicts: unknown[];
};
type RowsPage = {
    rows: Array<{ data: Record<string, unknown> }>;
};

const uploadMergeFile = async (
    cookie: string,
    orgId: string,
    datasetId: string,
    csv: string,
    mergeKeys: string[] = ['id']
): Promise<MergePreview> => {
    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'append.csv');

    const params = new URLSearchParams({
        orgId,
        datasetId,
        mergeKeys: mergeKeys.join(','),
    });
    const response = await api(`/api/data/datasets/merge/preview?${params}`, {
        method: 'POST',
        cookie,
        body: form,
    });
    if (response.status !== 200) {
        throw new Error(
            `merge preview failed: ${response.status} ${await response.text()}`
        );
    }

    return (await response.json()) as MergePreview;
};

describe('data-service /api/data/datasets/merge', () => {
    it('preview + commit appends rows to an existing dataset', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name\n1,Alice\n2,Bob',
        });

        const preview = await uploadMergeFile(
            user.cookie,
            user.orgId,
            dataset.id,
            'id,name\n3,Carla\n4,Dan'
        );
        expect(preview.statistics.totalNewRows).toBe(2);

        const commit = await api(
            `/api/data/datasets/merge/${preview.sessionId}/commit?orgId=${user.orgId}`,
            { method: 'POST', cookie: user.cookie }
        );
        expect(commit.status).toBe(200);

        const rows = await api(
            `/api/data/datasets/${dataset.id}/rows?offset=0&limit=20`,
            {
                cookie: user.cookie,
            }
        );
        const body = (await rows.json()) as RowsPage;
        const names = body.rows.map(r => r.data.name);
        expect(names).toEqual(expect.arrayContaining(['Alice', 'Bob', 'Carla', 'Dan']));
    });

    it('preview + cancel leaves the dataset untouched', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name\n1,Alice',
        });

        const preview = await uploadMergeFile(
            user.cookie,
            user.orgId,
            dataset.id,
            'id,name\n9,Ghost'
        );

        const cancel = await api(
            `/api/data/datasets/merge/${preview.sessionId}?orgId=${user.orgId}`,
            { method: 'DELETE', cookie: user.cookie }
        );
        expect(cancel.status).toBe(204);

        const rows = await api(`/api/data/datasets/${dataset.id}/rows`, {
            cookie: user.cookie,
        });
        const body = (await rows.json()) as RowsPage;
        expect(body.rows.some(r => r.data.name === 'Ghost')).toBe(false);
    });

    it('committing already-cancelled session -> 4xx', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name\n1,Alice',
        });

        const preview = await uploadMergeFile(
            user.cookie,
            user.orgId,
            dataset.id,
            'id,name\n2,Bob'
        );
        await api(`/api/data/datasets/merge/${preview.sessionId}?orgId=${user.orgId}`, {
            method: 'DELETE',
            cookie: user.cookie,
        });

        const commit = await api(
            `/api/data/datasets/merge/${preview.sessionId}/commit?orgId=${user.orgId}`,
            { method: 'POST', cookie: user.cookie }
        );
        expect(commit.status).toBeGreaterThanOrEqual(400);
        expect(commit.status).toBeLessThan(500);
    });

    it('merge plan reports new columns when source file has extra ones', async () => {
        const user = await registerAndLogin();
        const dataset = await uploadCsvDataset(user, {
            csv: 'id,name\n1,Alice',
        });

        const preview = await uploadMergeFile(
            user.cookie,
            user.orgId,
            dataset.id,
            'id,name,city\n2,Bob,Paris'
        );
        const newColKeys = preview.statistics.newColumns.map(c => c.key);
        expect(newColKeys).toContain('city');
    });
});
