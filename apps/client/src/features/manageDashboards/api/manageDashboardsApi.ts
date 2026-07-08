import { api, datasetRelationTagId } from '@/shared/api';

import type {
    AddDashboardChartPayload,
    AddDashboardItemResponse,
    AddDashboardMetricPayload,
    CreateDashboardPayload,
    CreateDashboardResponse,
    PreviewDashboardMetricPayload,
    PreviewDashboardMetricResponse,
    RemoveDashboardItemPayload,
    RenameDashboardPayload,
    UpdateDashboardLayoutPayload,
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
            query: ({ dashboardId, ...metric }) => ({
                url: `/dashboards/${dashboardId}/items`,
                method: 'POST',
                body: { kind: 'metric', ...metric },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        previewDashboardMetric: builder.query<
            PreviewDashboardMetricResponse,
            PreviewDashboardMetricPayload
        >({
            query: body => ({
                url: '/dashboards/metrics/preview',
                method: 'POST',
                body,
            }),
            providesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: datasetRelationTagId(arg.datasetId) },
            ],
            keepUnusedDataFor: 30,
        }),
        updateDashboardMetric: builder.mutation<void, UpdateDashboardMetricPayload>({
            query: ({ dashboardId, itemId, ...metric }) => ({
                url: `/dashboards/${dashboardId}/items/${itemId}`,
                method: 'PATCH',
                body: { kind: 'metric', ...metric },
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Dashboards', id: arg.dashboardId },
                { type: 'Dashboards', id: 'LIST' },
            ],
        }),
        updateDashboardLayout: builder.mutation<void, UpdateDashboardLayoutPayload>({
            query: ({ dashboardId, layout }) => ({
                url: `/dashboards/${dashboardId}/items/layout`,
                method: 'PATCH',
                body: { layout },
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
    usePreviewDashboardMetricQuery,
    useRemoveDashboardItemMutation,
    useRenameDashboardMutation,
    useUpdateDashboardLayoutMutation,
    useUpdateDashboardMetricMutation,
} = manageDashboardsApi;
