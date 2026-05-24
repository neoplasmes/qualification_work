import { api } from '@/shared/api';

import type {
    DatasetMetadata,
    DatasetRow,
    DatasetRowsPage,
    MergeCommitResult,
    MergePreviewResult,
} from './types';

export const datasetsApi = api.injectEndpoints({
    endpoints: builder => ({
        listDatasets: builder.query<DatasetMetadata[], string>({
            query: orgId => `/data/datasets?orgId=${encodeURIComponent(orgId)}`,
            providesTags: result =>
                result
                    ? [
                          ...result.map(item => ({
                              type: 'Datasets' as const,
                              id: item.dataset.id,
                          })),
                          { type: 'Datasets' as const, id: 'LIST' },
                      ]
                    : [{ type: 'Datasets' as const, id: 'LIST' }],
        }),
        getDatasetMetadata: builder.query<DatasetMetadata, string>({
            query: datasetId => `/data/datasets/${datasetId}/metadata`,
            providesTags: (_result, _error, datasetId) => [
                { type: 'Datasets', id: datasetId },
            ],
        }),
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
        deleteDataset: builder.mutation<void, string>({
            query: datasetId => ({
                url: `/data/datasets/${datasetId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, datasetId) => [
                { type: 'Datasets', id: 'LIST' },
                { type: 'Datasets', id: datasetId },
                { type: 'DatasetRows', id: datasetId },
            ],
        }),
        getDatasetRows: builder.query<
            DatasetRowsPage,
            { datasetId: string; offset?: number; limit?: number }
        >({
            query: ({ datasetId, offset = 0, limit = 200 }) =>
                `/data/datasets/${datasetId}/rows?offset=${offset}&limit=${limit}`,
            providesTags: (_result, _error, arg) => [
                { type: 'DatasetRows', id: arg.datasetId },
            ],
        }),
        updateRow: builder.mutation<
            DatasetRow,
            { datasetId: string; rowId: string; orgId: string; values: Record<string, unknown> }
        >({
            query: ({ datasetId, rowId, orgId, values }) => ({
                url: `/data/datasets/${datasetId}/rows/${rowId}?orgId=${encodeURIComponent(orgId)}`,
                method: 'PATCH',
                body: { values },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'DatasetRows', id: arg.datasetId },
            ],
        }),
        insertRow: builder.mutation<
            DatasetRow,
            { datasetId: string; orgId: string; data: Record<string, unknown> }
        >({
            query: ({ datasetId, orgId, data }) => ({
                url: `/data/datasets/${datasetId}/rows?orgId=${encodeURIComponent(orgId)}`,
                method: 'POST',
                body: { data },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'DatasetRows', id: arg.datasetId },
                { type: 'Datasets', id: arg.datasetId },
                { type: 'Datasets', id: 'LIST' },
            ],
        }),
        mergePreview: builder.mutation<
            MergePreviewResult,
            { orgId: string; datasetId?: string; name?: string; mergeKeys: string[]; files: File[] }
        >({
            query: ({ orgId, datasetId, name, mergeKeys, files }) => {
                const params = new URLSearchParams({ orgId });
                if (datasetId) {params.set('datasetId', datasetId);}
                if (name) {params.set('name', name);}
                if (mergeKeys.length > 0) {params.set('mergeKeys', mergeKeys.join(','));}

                const body = new FormData();
                for (const file of files) {body.append('file', file);}

                return {
                    url: `/data/datasets/merge/preview?${params.toString()}`,
                    method: 'POST',
                    body,
                };
            },
        }),
        mergeCommit: builder.mutation<MergeCommitResult, { sessionId: string; orgId: string }>({
            query: ({ sessionId, orgId }) => ({
                url: `/data/datasets/merge/${sessionId}/commit?orgId=${encodeURIComponent(orgId)}`,
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'Datasets', id: 'LIST' }],
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
    useDeleteDatasetMutation,
    useGetDatasetMetadataQuery,
    useGetDatasetRowsQuery,
    useInsertRowMutation,
    useLazyGetDatasetMetadataQuery,
    useLazyGetDatasetRowsQuery,
    useListDatasetsQuery,
    useMergeCancelMutation,
    useMergeCommitMutation,
    useMergePreviewMutation,
    useUpdateRowMutation,
    useUploadDatasetMutation,
} = datasetsApi;
