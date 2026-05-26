import { api } from '@/shared/api';

import type { Dashboard } from './types';

export const dashboardApi = api.injectEndpoints({
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
