import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    api,
    createTestUserWithOrg,
    dbQuery,
    startServer,
    stopServer,
    truncate,
} from './setup';

const mimeType = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

type DatasetRecord = {
    id: string;
    org_id: string;
    name: string;
    source_type: 'csv' | 'xlsx';
};

type DatasetColumnRecord = {
    key: string;
    display_name: string;
    data_type: 'number' | 'string' | 'date' | 'bool';
    order_index: number;
};

type DatasetRowRecord = {
    row_index: number;
    data: Record<string, unknown>;
};

const assetsDir = path.resolve(import.meta.dirname, 'assets');

async function getDatasetSnapshotPayload(datasetId: string) {
    const [dataset] = await dbQuery<DatasetRecord>(
        `SELECT id, org_id, name, source_type
         FROM data.datasets
         WHERE id = $1`,
        [datasetId]
    );

    const columns = await dbQuery<DatasetColumnRecord>(
        `SELECT key, display_name, data_type, order_index
         FROM data.dataset_columns
         WHERE dataset_id = $1
         ORDER BY order_index`,
        [datasetId]
    );

    const rows = await dbQuery<DatasetRowRecord>(
        `SELECT row_index, data
         FROM data.dataset_rows
         WHERE dataset_id = $1
         ORDER BY row_index`,
        [datasetId]
    );

    return {
        dataset: {
            name: dataset.name,
            sourceType: dataset.source_type,
        },
        columns,
        rows: rows.map(row => ({
            rowIndex: row.row_index,
            data: row.data,
        })),
    };
}

async function uploadDataset(
    orgId: string,
    fileName: string,
    mimeType: string
): Promise<string> {
    const fileBuffer = await readFile(path.join(assetsDir, fileName));
    const formData = new FormData();

    formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

    const res = await api(`/api/datasets?orgId=${orgId}`, {
        method: 'POST',
        body: formData,
    });

    expect(res.status).toBe(201);

    const body = (await res.json()) as { id: string };

    expect(typeof body.id).toBe('string');

    return body.id;
}

beforeAll(startServer);
afterAll(stopServer);

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(truncate);

//! snapshots are .... nemnogo govno
describe('POST /api/datasets', () => {
    it('csv dataset uploading', async () => {
        const { orgId } = await createTestUserWithOrg();

        const datasetId = await uploadDataset(orgId, 'datasetBasic.csv', mimeType.csv);

        expect(await getDatasetSnapshotPayload(datasetId)).toMatchSnapshot();
    });

    it('uploads xlsx dataset and persists typed row values', async () => {
        const { orgId } = await createTestUserWithOrg();

        const datasetId = await uploadDataset(orgId, 'datasetBasic.xlsx', mimeType.xlsx);

        expect(await getDatasetSnapshotPayload(datasetId)).toMatchSnapshot();
    });

    it('handles five uploads concurrently and stores every dataset completely', async () => {
        const { orgId } = await createTestUserWithOrg();

        await Promise.all([
            uploadDataset(orgId, 'datasetBasic.csv', mimeType.csv),
            uploadDataset(orgId, 'datasetBasic.xlsx', mimeType.xlsx),
            uploadDataset(orgId, 'datasetWithWhitespace.csv', mimeType.csv),
            uploadDataset(orgId, 'datasetMultiSheet.xlsx', mimeType.xlsx),
            uploadDataset(orgId, 'datasetBasic.csv', mimeType.csv),
        ]);

        const datasets = await dbQuery<DatasetRecord>(
            `SELECT id, org_id, name, source_type
             FROM data.datasets
             WHERE org_id = $1
             ORDER BY name, source_type`,
            [orgId]
        );

        expect(datasets).toHaveLength(5);

        const [columnsStats] = await dbQuery<{ count: string }>(
            `SELECT COUNT(*)::text AS count
             FROM data.dataset_columns
             WHERE dataset_id = ANY($1::uuid[])`,
            [datasets.map(dataset => dataset.id)]
        );
        expect(Number(columnsStats.count)).toBe(40);

        const [rowsStats] = await dbQuery<{ count: string }>(
            `SELECT COUNT(*)::text AS count
             FROM data.dataset_rows
             WHERE dataset_id = ANY($1::uuid[])`,
            [datasets.map(dataset => dataset.id)]
        );
        expect(Number(rowsStats.count)).toBe(110);

        const perDatasetRows = await dbQuery<{ dataset_id: string; rows_count: string }>(
            `SELECT dataset_id, COUNT(*)::text AS rows_count
             FROM data.dataset_rows
             WHERE dataset_id = ANY($1::uuid[])
             GROUP BY dataset_id`,
            [datasets.map(dataset => dataset.id)]
        );

        expect(perDatasetRows).toHaveLength(5);
        expect({
            datasets: datasets.map(dataset => ({
                name: dataset.name,
                sourceType: dataset.source_type,
            })),
            columnsCount: Number(columnsStats.count),
            rowsCount: Number(rowsStats.count),
            rowsPerDataset: perDatasetRows
                .map(dataset => Number(dataset.rows_count))
                .sort((left, right) => left - right),
        }).toMatchSnapshot();
    });
});
