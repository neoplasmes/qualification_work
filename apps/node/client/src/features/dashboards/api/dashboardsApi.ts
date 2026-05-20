import { api } from '@/shared/api';

import type {
    AddDashboardChartPayload,
    AddDashboardItemResponse,
    AddDashboardMetricPayload,
    CreateDashboardPayload,
    CreateDashboardResponse,
    Dashboard,
    ReorderDashboardItemsPayload,
    RemoveDashboardItemPayload,
    RenameDashboardPayload,
} from './types';

export const dashboardsApi = api.injectEndpoints({
    endpoints: builder => ({
        listDashboards: builder.query<Dashboard[], string>({
            query: orgId => `/dashboards?orgId=${encodeURIComponent(orgId)}`,
            providesTags: result =>
                result
                    ? [
                          ...result.map(dashboard => ({
                              type: 'Dashboards' as const,
                              id: dashboard.id,
                          })),
                          { type: 'Dashboards' as const, id: 'LIST' },
                      ]
                    : [{ type: 'Dashboards' as const, id: 'LIST' }],
        }),
        getDashboard: builder.query<Dashboard, string>({
            query: dashboardId => `/dashboards/${dashboardId}`,
            providesTags: (_result, _error, dashboardId) => [
                { type: 'Dashboards', id: dashboardId },
            ],
        }),
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
        deleteDashboard: builder.mutation<void, string>({
            query: dashboardId => ({
                url: `/dashboards/${dashboardId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, dashboardId) => [
                { type: 'Dashboards', id: dashboardId },
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
            ],
        }),
    }),
});

export const {
    useAddDashboardChartMutation,
    useAddDashboardMetricMutation,
    useCreateDashboardMutation,
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
    useReorderDashboardItemsMutation,
    useRemoveDashboardItemMutation,
    useRenameDashboardMutation,
} = dashboardsApi;
