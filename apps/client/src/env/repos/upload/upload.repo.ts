import { parseResponse } from '@/env/tools/responseSchema';
import type { HttpTransport } from '@/env/transport/http';

import type {
    MergeInput,
    MergeSessionInput,
    UploadHandle,
    UploadInput,
    UploadRepo,
} from '@/app/ports/repos/upload';

import { commitSchema, previewSchema, uploadSchema } from './upload.schema';

export class HttpUploadRepo implements UploadRepo {
    constructor(
        private readonly transport: HttpTransport,
        private readonly resolve: (handle: UploadHandle) => File
    ) {}

    async uploadDataset(input: UploadInput) {
        const body = new FormData();
        body.append('file', this.resolve(input.file));

        return parseResponse(
            uploadSchema,
            await this.transport.request({
                path: `/data/datasets?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'POST',
                body,
                responseType: 'json',
            })
        );
    }
    async previewDatasetMerge(input: MergeInput) {
        const params = new URLSearchParams({ orgId: input.orgId });
        if (input.datasetId) {
            params.set('datasetId', input.datasetId);
        }
        if (input.name) {
            params.set('name', input.name);
        }
        if (input.mode) {
            params.set('mode', input.mode);
        }
        if (input.createNew) {
            params.set('createNew', 'true');
        }
        if (input.mergeKeys.length) {
            params.set('mergeKeys', input.mergeKeys.join(','));
        }
        const body = new FormData();
        for (const file of input.files) {
            body.append('file', this.resolve(file));
        }

        return parseResponse(
            previewSchema,
            await this.transport.request({
                path: `/data/datasets/merge/preview?${params}`,
                method: 'POST',
                body,
                responseType: 'json',
            })
        );
    }
    async commitDatasetMerge(input: MergeSessionInput) {
        // resulting datasetId can be either existing or freshly-created
        return parseResponse(
            commitSchema,
            await this.transport.request({
                path: `/data/datasets/merge/${encodeURIComponent(input.sessionId)}/commit?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'POST',
                responseType: 'json',
            })
        );
    }
    async cancelDatasetMerge(input: MergeSessionInput): Promise<void> {
        await this.transport.request({
            path: `/data/datasets/merge/${encodeURIComponent(input.sessionId)}?orgId=${encodeURIComponent(input.orgId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }
}
