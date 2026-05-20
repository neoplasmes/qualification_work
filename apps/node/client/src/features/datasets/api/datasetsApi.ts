import { api } from '@/shared/api';

import type { DatasetMetadata, DatasetRowsPage } from './types';

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
            query: ({ datasetId, offset = 0, limit = 50 }) =>
                `/data/datasets/${datasetId}/rows?offset=${offset}&limit=${limit}`,
            providesTags: (_result, _error, arg) => [
                { type: 'DatasetRows', id: arg.datasetId },
            ],
        }),
    }),
});

export const {
    useDeleteDatasetMutation,
    useGetDatasetMetadataQuery,
    useGetDatasetRowsQuery,
    useLazyGetDatasetMetadataQuery,
    useLazyGetDatasetRowsQuery,
    useListDatasetsQuery,
    useUploadDatasetMutation,
} = datasetsApi;
