import type { Dashboard, DashboardItem } from '@qualification-work/types';

import { api, chartRelationTagId, datasetRelationTagId } from '@/shared/api';

type DashboardCacheTag = {
    type: 'Dashboards';
    id: string;
};

const getDashboardItemTags = (item: DashboardItem): DashboardCacheTag[] => {
    if (item.kind === 'metric') {
        return [{ type: 'Dashboards', id: datasetRelationTagId(item.datasetId) }];
    }

    return [{ type: 'Dashboards', id: chartRelationTagId(item.chartId) }];
};

const getDashboardTags = (dashboard: Dashboard): DashboardCacheTag[] => [
    { type: 'Dashboards', id: dashboard.id },
    ...dashboard.items.flatMap(getDashboardItemTags),
];

export const dashboardApi = api.injectEndpoints({
    endpoints: builder => ({
        listDashboards: builder.query<Dashboard[], string>({
            query: orgId => `/dashboards?orgId=${encodeURIComponent(orgId)}`,
            providesTags: result =>
                result
                    ? [
                          ...result.flatMap(getDashboardTags),
                          { type: 'Dashboards', id: 'LIST' },
                      ]
                    : [{ type: 'Dashboards' as const, id: 'LIST' }],
        }),
        getDashboard: builder.query<Dashboard, string>({
            query: dashboardId => `/dashboards/${dashboardId}`,
            providesTags: (result, _error, dashboardId) =>
                result
                    ? getDashboardTags(result)
                    : [{ type: 'Dashboards', id: dashboardId }],
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
    }),
});

export const {
    useDeleteDashboardMutation,
    useGetDashboardQuery,
    useListDashboardsQuery,
} = dashboardApi;
