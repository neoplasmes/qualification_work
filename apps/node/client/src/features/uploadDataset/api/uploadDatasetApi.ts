import type { CommitMergeResult, MergePreviewResult } from '@qualification-work/types';

import { api } from '@/shared/api';

export const uploadDatasetApi = api.injectEndpoints({
    endpoints: builder => ({
        uploadDataset: builder.mutation<{ id: string }, { orgId: string; file: File }>({
            query: ({ orgId, file }) => {
                const body = new FormData();
                body.append('file', file);

                return {
                    url: `/data/datasets?orgId=${encodeURIComponent(orgId)}`,
                    method: 'POST',
                    body,
                };
            },
            invalidatesTags: [{ type: 'Datasets', id: 'LIST' }],
        }),
        mergePreview: builder.mutation<
            MergePreviewResult,
            {
                orgId: string;
                datasetId?: string;
                name?: string;
                mode?: 'append' | 'merge';
                createNew?: boolean;
                mergeKeys: string[];
                files: File[];
            }
        >({
            query: ({ orgId, datasetId, name, mode, createNew, mergeKeys, files }) => {
                const params = new URLSearchParams({ orgId });
                if (datasetId) {
                    params.set('datasetId', datasetId);
                }
                if (name) {
                    params.set('name', name);
                }
                if (mode) {
                    params.set('mode', mode);
                }
                if (createNew) {
                    params.set('createNew', 'true');
                }
                if (mergeKeys.length > 0) {
                    params.set('mergeKeys', mergeKeys.join(','));
                }

                const body = new FormData();
                for (const file of files) {
                    body.append('file', file);
                }

                return {
                    url: `/data/datasets/merge/preview?${params.toString()}`,
                    method: 'POST',
                    body,
                };
            },
        }),
        mergeCommit: builder.mutation<
            CommitMergeResult,
            { sessionId: string; orgId: string }
        >({
            query: ({ sessionId, orgId }) => ({
                url: `/data/datasets/merge/${sessionId}/commit?orgId=${encodeURIComponent(orgId)}`,
                method: 'POST',
            }),
            // resulting datasetId can be either existing or freshly-created -> invalidate
            // both metadata and rows so the preview/grid reload right after commit
            invalidatesTags: result =>
                result
                    ? [
                          { type: 'Datasets', id: 'LIST' },
                          { type: 'Datasets', id: result.datasetId },
                          { type: 'DatasetRows', id: result.datasetId },
                      ]
                    : [{ type: 'Datasets', id: 'LIST' }],
        }),
        mergeCancel: builder.mutation<void, string>({
            query: sessionId => ({
                url: `/data/datasets/merge/${sessionId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
        }),
    }),
});

export const {
    useMergeCancelMutation,
    useMergeCommitMutation,
    useMergePreviewMutation,
    useUploadDatasetMutation,
} = uploadDatasetApi;
