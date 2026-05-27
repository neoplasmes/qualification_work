import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { api } from '../setup';

const assetsDir = path.resolve(import.meta.dirname, './assets');

export const mimeType = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export function assetPath(fileName: string): string {
    return path.join(assetsDir, fileName);
}

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

export type MergeFile = {
    fileName: string;
    mime?: string;
};

export async function buildMergeFormData(files: MergeFile[]): Promise<FormData> {
    const form = new FormData();
    for (const f of files) {
        const buf = await readFile(path.join(assetsDir, f.fileName));
        const mime = f.mime ?? mimeType.csv;
        form.append('file', new Blob([buf], { type: mime }), f.fileName);
    }

    return form;
}

export type MergePreviewQuery = {
    orgId: string;
    datasetId?: string;
    name?: string;
    mode?: 'append' | 'merge';
    createNew?: boolean;
    mergeKeys?: string[];
};

export async function mergePreview(
    query: MergePreviewQuery,
    files: MergeFile[]
): Promise<Response> {
    const params = new URLSearchParams({ orgId: query.orgId });
    if (query.datasetId) {
        params.set('datasetId', query.datasetId);
    }
    if (query.name) {
        params.set('name', query.name);
    }
    if (query.mode) {
        params.set('mode', query.mode);
    }
    if (query.createNew) {
        params.set('createNew', 'true');
    }
    if (query.mergeKeys?.length) {
        params.set('mergeKeys', query.mergeKeys.join(','));
    }

    const form = await buildMergeFormData(files);

    return api(`/api/datasets/merge/preview?${params.toString()}`, {
        method: 'POST',
        body: form,
    });
}

export async function mergeCommit(sessionId: string, orgId: string): Promise<Response> {
    return api(`/api/datasets/merge/${sessionId}/commit?orgId=${orgId}`, {
        method: 'POST',
    });
}

export async function mergeCancel(sessionId: string, orgId: string): Promise<Response> {
    return api(`/api/datasets/merge/${sessionId}?orgId=${orgId}`, {
        method: 'DELETE',
    });
}
