import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from '../setup';
import { mergeCommit, mergePreview } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('merge - create new dataset from N files', () => {
    it('append mode creates one new dataset from files with identical schema', async () => {
        const { orgId } = await createTestUserWithOrg();

        const previewRes = await mergePreview(
            { orgId, name: 'appended', mode: 'append' },
            [{ fileName: 'mergeBase.csv' }, { fileName: 'mergeSameSchemaSecond.csv' }]
        );
        expect(previewRes.status).toBe(200);
        const preview = (await previewRes.json()) as {
            sessionId: string;
            statistics: { totalIncomingRows: number; totalNewRows: number };
        };
        expect(preview.statistics.totalIncomingRows).toBe(5);
        expect(preview.statistics.totalNewRows).toBe(5);

        const commitRes = await mergeCommit(preview.sessionId, orgId);
        expect(commitRes.status).toBe(200);
        const commit = (await commitRes.json()) as {
            datasetId: string;
            insertedRows: number;
        };
        expect(commit.insertedRows).toBe(5);

        const [meta] = await dbQuery<{ name: string }>(
            `SELECT name FROM data.datasets WHERE id = $1`,
            [commit.datasetId]
        );
        expect(meta.name).toBe('appended');

        const cols = await dbQuery<{ key: string; data_type: string }>(
            `SELECT key, data_type FROM data.dataset_columns
             WHERE dataset_id = $1 ORDER BY order_index`,
            [commit.datasetId]
        );
        expect(cols.map(c => c.key)).toEqual(['id', 'name', 'age', 'city']);
        expect(cols.map(c => c.data_type)).toEqual([
            'number',
            'string',
            'number',
            'string',
        ]);
    });

    it('append mode rejects new-dataset files with different columns or types', async () => {
        const { orgId } = await createTestUserWithOrg();

        const columnRes = await mergePreview(
            { orgId, name: 'broken-columns', mode: 'append' },
            [{ fileName: 'mergeBase.csv' }, { fileName: 'mergeAdditional.csv' }]
        );
        expect(columnRes.status).toBe(400);

        const typeRes = await mergePreview(
            { orgId, name: 'broken-types', mode: 'append' },
            [{ fileName: 'mergeBase.csv' }, { fileName: 'mergeTypeMismatch.csv' }]
        );
        expect(typeRes.status).toBe(400);
    });

    it('creates new dataset combining union of columns and rows', async () => {
        const { orgId } = await createTestUserWithOrg();

        const previewRes = await mergePreview(
            { orgId, name: 'merged', mergeKeys: ['id'] },
            [{ fileName: 'mergeBase.csv' }, { fileName: 'mergeAdditional.csv' }]
        );
        expect(previewRes.status).toBe(200);
        const preview = (await previewRes.json()) as {
            sessionId: string;
            statistics: { totalIncomingRows: number };
        };
        expect(preview.statistics.totalIncomingRows).toBe(6);

        const commitRes = await mergeCommit(preview.sessionId, orgId);
        expect(commitRes.status).toBe(200);
        const commit = (await commitRes.json()) as {
            datasetId: string;
            insertedRows: number;
        };
        expect(commit.insertedRows).toBe(6);

        const [meta] = await dbQuery<{ name: string }>(
            `SELECT name FROM data.datasets WHERE id = $1`,
            [commit.datasetId]
        );
        expect(meta.name).toBe('merged');

        const cols = await dbQuery<{ key: string }>(
            `SELECT key FROM data.dataset_columns WHERE dataset_id = $1 ORDER BY order_index`,
            [commit.datasetId]
        );
        const keys = cols.map(c => c.key);
        // union: id, name, age, city (from base), country (from additional)
        expect(keys).toContain('id');
        expect(keys).toContain('name');
        expect(keys).toContain('age');
        expect(keys).toContain('city');
        expect(keys).toContain('country');

        const rows = await dbQuery<{ data: Record<string, unknown> }>(
            `SELECT data FROM data.dataset_rows WHERE dataset_id = $1 ORDER BY row_index`,
            [commit.datasetId]
        );
        expect(rows.length).toBe(6);
    });

    it('rejects when same merge key is present in two files', async () => {
        const { orgId } = await createTestUserWithOrg();

        const res = await mergePreview({ orgId, name: 'broken', mergeKeys: ['id'] }, [
            { fileName: 'mergeBase.csv' },
            { fileName: 'mergeConflicting.csv' },
        ]);

        // mergeBase has id=1, mergeConflicting also has id=1 -> intersect -> 400
        expect(res.status).toBe(400);
    });

    it('requires mergeKeys for multi-file new dataset', async () => {
        const { orgId } = await createTestUserWithOrg();

        const res = await mergePreview({ orgId, name: 'no-keys' }, [
            { fileName: 'mergeBase.csv' },
            { fileName: 'mergeAdditional.csv' },
        ]);

        expect(res.status).toBe(400);
    });
});
