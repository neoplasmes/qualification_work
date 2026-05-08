import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { api, dbQuery } from '../setup';

const assetsDir = path.resolve(import.meta.dirname, '../datasets/assets');

export type ColumnRecord = { id: string; key: string; dataType: string };

export async function uploadDataset(orgId: string): Promise<string> {
    const buf = await readFile(path.join(assetsDir, 'datasetBasic.csv'));
    const form = new FormData();
    form.append('file', new Blob([buf], { type: 'text/csv' }), 'datasetBasic.csv');

    const res = await api(`/api/datasets?orgId=${orgId}`, { method: 'POST', body: form });
    const body = (await res.json()) as { id: string };

    return body.id;
}

export async function getColumnId(datasetId: string, key: string): Promise<string> {
    const [col] = await dbQuery<ColumnRecord>(
        `SELECT id, key, data_type AS "dataType"
         FROM data.dataset_columns
         WHERE dataset_id = $1 AND key = $2`,
        [datasetId, key]
    );

    return col.id;
}

export async function createChart(
    orgId: string,
    datasetId: string,
    config: Record<string, unknown>
): Promise<string> {
    const res = await api('/api/charts', {
        method: 'POST',
        body: JSON.stringify({
            orgId,
            datasetId,
            name: 'test chart',
            chartType: config.kind,
            config,
        }),
    });

    return ((await res.json()) as { id: string }).id;
}

export function encodeFilters(filters: unknown): string {
    return Buffer.from(JSON.stringify(filters)).toString('base64url');
}
