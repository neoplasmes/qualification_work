import { api } from '@/shared/api';

import type {
    DatasetMetadata,
    DatasetRow,
    DatasetRowsPage,
    PatchDatasetPayload,
} from './types';

export const datasetApi = api.injectEndpoints({
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
        patchDataset: builder.mutation<void, PatchDatasetPayload>({
            query: ({ datasetId, ...body }) => ({
                url: `/data/datasets/${datasetId}`,
                method: 'PATCH',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Datasets', id: 'LIST' },
                { type: 'Datasets', id: arg.datasetId },
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
            {
                datasetId: string;
                rowId: string;
                orgId: string;
                values: Record<string, unknown>;
            }
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
            {
                datasetId: string;
                orgId: string;
                afterRowId?: string;
                data: Record<string, unknown>;
            }
        >({
            query: ({ datasetId, orgId, afterRowId, data }) => ({
                url: `/data/datasets/${datasetId}/rows?orgId=${encodeURIComponent(orgId)}`,
                method: 'POST',
                body: { afterRowId, data },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'DatasetRows', id: arg.datasetId },
                { type: 'Datasets', id: arg.datasetId },
                { type: 'Datasets', id: 'LIST' },
            ],
        }),
        deleteRow: builder.mutation<
            DatasetRow,
            { datasetId: string; rowId: string; orgId: string }
        >({
            query: ({ datasetId, rowId, orgId }) => ({
                url: `/data/datasets/${datasetId}/rows/${rowId}?orgId=${encodeURIComponent(orgId)}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'DatasetRows', id: arg.datasetId },
                { type: 'Datasets', id: arg.datasetId },
                { type: 'Datasets', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useDeleteDatasetMutation,
    useDeleteRowMutation,
    useGetDatasetMetadataQuery,
    useGetDatasetRowsQuery,
    useInsertRowMutation,
    useLazyGetDatasetMetadataQuery,
    useLazyGetDatasetRowsQuery,
    useListDatasetsQuery,
    usePatchDatasetMutation,
    useUpdateRowMutation,
} = datasetApi;
