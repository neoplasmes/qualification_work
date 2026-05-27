import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { mergeCancel, mergeCommit, mergePreview, uploadDataset } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('merge into existing dataset', () => {
    it('append mode adds all incoming rows even when they duplicate existing data', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const previewRes = await mergePreview({ orgId, datasetId, mode: 'append' }, [
            { fileName: 'mergeBase.csv' },
        ]);

        expect(previewRes.status).toBe(200);
        const preview = (await previewRes.json()) as {
            sessionId: string;
            statistics: {
                totalIncomingRows: number;
                totalNewRows: number;
                totalDuplicateRows: number;
            };
        };
        expect(preview.statistics.totalIncomingRows).toBe(3);
        expect(preview.statistics.totalNewRows).toBe(3);
        expect(preview.statistics.totalDuplicateRows).toBe(0);

        const commitRes = await mergeCommit(preview.sessionId, orgId);
        expect(commitRes.status).toBe(200);
        const commit = (await commitRes.json()) as {
            datasetId: string;
            insertedRows: number;
            skippedDuplicates: number;
        };
        expect(commit.datasetId).toBe(datasetId);
        expect(commit.insertedRows).toBe(3);
        expect(commit.skippedDuplicates).toBe(0);

        const [{ count }] = await dbQuery<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM data.dataset_rows WHERE dataset_id = $1`,
            [datasetId]
        );
        expect(Number(count)).toBe(6);
    });

    it('append mode rejects files with missing columns', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const res = await mergePreview({ orgId, datasetId, mode: 'append' }, [
            { fileName: 'mergeAppendMissing.csv' },
        ]);

        expect(res.status).toBe(400);
    });

    it('append mode rejects files with extra columns', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const res = await mergePreview({ orgId, datasetId, mode: 'append' }, [
            { fileName: 'mergeAppendExtra.csv' },
        ]);

        expect(res.status).toBe(400);
    });

    it('append createNew copies old rows and appends incoming rows without changing source', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const previewRes = await mergePreview(
            { orgId, datasetId, mode: 'append', createNew: true },
            [{ fileName: 'mergeBase.csv' }]
        );
        expect(previewRes.status).toBe(200);
        const preview = (await previewRes.json()) as {
            sessionId: string;
            statistics: { copiedRows: number; totalNewRows: number };
        };
        expect(preview.statistics.copiedRows).toBe(3);
        expect(preview.statistics.totalNewRows).toBe(3);

        const commitRes = await mergeCommit(preview.sessionId, orgId);
        expect(commitRes.status).toBe(200);
        const commit = (await commitRes.json()) as {
            datasetId: string;
            copiedRows: number;
            insertedRows: number;
        };
        expect(commit.datasetId).not.toBe(datasetId);
        expect(commit.copiedRows).toBe(3);
        expect(commit.insertedRows).toBe(3);

        const [sourceCount, copyCount] = await Promise.all([
            dbQuery<{ count: string }>(
                `SELECT COUNT(*)::text AS count FROM data.dataset_rows WHERE dataset_id = $1`,
                [datasetId]
            ),
            dbQuery<{ count: string }>(
                `SELECT COUNT(*)::text AS count FROM data.dataset_rows WHERE dataset_id = $1`,
                [commit.datasetId]
            ),
        ]);
        expect(Number(sourceCount[0].count)).toBe(3);
        expect(Number(copyCount[0].count)).toBe(6);
    });

    it('merge createNew copies old rows and appends only non-duplicates', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const previewRes = await mergePreview(
            { orgId, datasetId, mode: 'merge', createNew: true, mergeKeys: ['id'] },
            [{ fileName: 'mergeAdditional.csv' }]
        );
        expect(previewRes.status).toBe(200);
        const preview = (await previewRes.json()) as {
            sessionId: string;
            statistics: { copiedRows: number; totalNewRows: number };
        };
        expect(preview.statistics.copiedRows).toBe(3);
        expect(preview.statistics.totalNewRows).toBe(3);

        const commitRes = await mergeCommit(preview.sessionId, orgId);
        expect(commitRes.status).toBe(200);
        const commit = (await commitRes.json()) as {
            datasetId: string;
            copiedRows: number;
            insertedRows: number;
        };
        expect(commit.datasetId).not.toBe(datasetId);
        expect(commit.copiedRows).toBe(3);
        expect(commit.insertedRows).toBe(3);

        const sourceRows = await dbQuery<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM data.dataset_rows WHERE dataset_id = $1`,
            [datasetId]
        );
        const copyRows = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows WHERE dataset_id = $1 ORDER BY row_index`,
            [commit.datasetId]
        );
        expect(Number(sourceRows[0].count)).toBe(3);
        expect(copyRows.length).toBe(6);
        expect(copyRows.some(row => row.data.name === 'Diana')).toBe(true);
    });

    it('preview + commit appends new rows and adds new columns as NULL on old rows', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const previewRes = await mergePreview({ orgId, datasetId, mergeKeys: ['id'] }, [
            { fileName: 'mergeAdditional.csv' },
        ]);

        expect(previewRes.status).toBe(200);
        const preview = (await previewRes.json()) as {
            sessionId: string;
            statistics: {
                totalNewRows: number;
                totalDuplicateRows: number;
                newColumns: Array<{ key: string }>;
            };
            conflicts: unknown[];
        };

        expect(preview.statistics.totalNewRows).toBe(3);
        expect(preview.statistics.totalDuplicateRows).toBe(0);
        expect(preview.statistics.newColumns.map(c => c.key)).toContain('country');
        expect(preview.conflicts).toEqual([]);

        const commitRes = await mergeCommit(preview.sessionId, orgId);
        expect(commitRes.status).toBe(200);
        const commit = (await commitRes.json()) as {
            insertedRows: number;
            skippedDuplicates: number;
        };
        expect(commit.insertedRows).toBe(3);
        expect(commit.skippedDuplicates).toBe(0);

        const rows = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows
             WHERE dataset_id = $1 ORDER BY row_index`,
            [datasetId]
        );
        expect(rows.length).toBe(6);

        // old rows should NOT have 'country' key in jsonb
        expect('country' in rows[0].data).toBe(false);
        // new rows have country but NOT city
        const diana = rows.find(r => r.data.name === 'Diana');
        expect(diana?.data.country).toBe('Italy');
        expect('city' in (diana?.data ?? {})).toBe(false);
    });

    it('preview returns 409 on conflicting values for the same merge key', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const res = await mergePreview({ orgId, datasetId, mergeKeys: ['id'] }, [
            { fileName: 'mergeConflicting.csv' },
        ]);

        expect(res.status).toBe(409);
    });

    it('preview returns 400 on duplicate merge key inside one file', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const res = await mergePreview({ orgId, datasetId, mergeKeys: ['id'] }, [
            { fileName: 'mergeDuplicateKey.csv' },
        ]);

        expect(res.status).toBe(400);
    });

    it('preview returns 400 when new file shares no columns besides merge key', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const res = await mergePreview({ orgId, datasetId, mergeKeys: ['id'] }, [
            { fileName: 'mergeUnrelated.csv' },
        ]);

        expect(res.status).toBe(400);
    });

    it('cancel removes session and tmp files', async () => {
        const { orgId } = await createTestUserWithOrg();
        const datasetId = await uploadDataset(orgId, 'mergeBase.csv');

        const previewRes = await mergePreview({ orgId, datasetId, mergeKeys: ['id'] }, [
            { fileName: 'mergeAdditional.csv' },
        ]);
        const { sessionId } = (await previewRes.json()) as { sessionId: string };

        const cancelRes = await mergeCancel(sessionId, orgId);
        expect(cancelRes.status).toBe(204);

        // commit after cancel must fail
        const commitRes = await mergeCommit(sessionId, orgId);
        expect(commitRes.status).toBe(404);
    });
});
