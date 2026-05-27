import { api } from '@/shared/api';

import type {
    AddDashboardChartPayload,
    AddDashboardItemResponse,
    AddDashboardMetricPayload,
    CreateDashboardPayload,
    CreateDashboardResponse,
    RemoveDashboardItemPayload,
    RenameDashboardPayload,
    ReorderDashboardItemsPayload,
    UpdateDashboardMetricPayload,
} from './types';

export const manageDashboardsApi = api.injectEndpoints({
    endpoints: builder => ({
        createDashboard: builder.mutation<
            CreateDashboardResponse,
            CreateDashboardPayload
        >({
            query: body => ({
                url: '/dashboards',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Dashboards', id: 'LIST' }],
        }),
        renameDashboard: builder.mutation<void, RenameDashboardPayload>({
            query: ({ dashboardId, name }) => ({
                url: `/dashboards/${dashboardId}`,
                method: 'PATCH',
                body: { name },
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        addDashboardChart: builder.mutation<
            AddDashboardItemResponse,
            AddDashboardChartPayload
        >({
            query: ({ dashboardId, chartId, height }) => ({
                url: `/dashboards/${dashboardId}/items`,
                method: 'POST',
                body: { kind: 'chart', chartId, height },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        addDashboardMetric: builder.mutation<
            AddDashboardItemResponse,
            AddDashboardMetricPayload
        >({
            query: ({ dashboardId, datasetId, name, expression, format, height }) => ({
                url: `/dashboards/${dashboardId}/items`,
                method: 'POST',
                body: { kind: 'metric', datasetId, name, expression, format, height },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        updateDashboardMetric: builder.mutation<void, UpdateDashboardMetricPayload>({
            query: ({ dashboardId, itemId, datasetId, name, expression, format }) => ({
                url: `/dashboards/${dashboardId}/items/${itemId}`,
                method: 'PATCH',
                body: { kind: 'metric', datasetId, name, expression, format },
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        reorderDashboardItems: builder.mutation<void, ReorderDashboardItemsPayload>({
            query: ({ dashboardId, order }) => ({
                url: `/dashboards/${dashboardId}/items/order`,
                method: 'PATCH',
                body: { order },
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        removeDashboardItem: builder.mutation<void, RemoveDashboardItemPayload>({
            query: ({ dashboardId, itemId }) => ({
                url: `/dashboards/${dashboardId}/items/${itemId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useAddDashboardChartMutation,
    useAddDashboardMetricMutation,
    useCreateDashboardMutation,
    useReorderDashboardItemsMutation,
    useRemoveDashboardItemMutation,
    useRenameDashboardMutation,
    useUpdateDashboardMetricMutation,
} = manageDashboardsApi;
