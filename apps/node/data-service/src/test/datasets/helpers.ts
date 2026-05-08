import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { api } from '../setup';

const assetsDir = path.resolve(import.meta.dirname, './assets');

export const mimeType = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export async function uploadDataset(
    orgId: string,
    fileName = 'datasetBasic.csv',
    mime: string = mimeType.csv
): Promise<string> {
    const buf = await readFile(path.join(assetsDir, fileName));
    const form = new FormData();
    form.append('file', new Blob([buf], { type: mime }), fileName);

    const res = await api(`/api/datasets?orgId=${orgId}`, { method: 'POST', body: form });

    return ((await res.json()) as { id: string }).id;
}
