import { api } from '@/shared/api';

import type { Chart, ChartResponse, GetChartDataPayload } from './types';

const encodeFilterOverrides = (filters: GetChartDataPayload['filterOverrides']) => {
    if (!filters || filters.length === 0) {
        return '';
    }

    const json = JSON.stringify(filters);
    const base64 =
        typeof btoa === 'function'
            ? btoa(json)
            : Buffer.from(json, 'utf-8').toString('base64');
    const encoded = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

    return `?filterOverrides=${encoded}`;
};

export const chartApi = api.injectEndpoints({
    endpoints: builder => ({
        listCharts: builder.query<Chart[], string>({
            query: orgId => `/data/charts?orgId=${encodeURIComponent(orgId)}`,
            providesTags: result =>
                result
                    ? [
                          ...result.map(chart => ({
                              type: 'Charts' as const,
                              id: chart.id,
                          })),
                          { type: 'Charts' as const, id: 'LIST' },
                      ]
                    : [{ type: 'Charts' as const, id: 'LIST' }],
        }),
        getChart: builder.query<Chart, string>({
            query: chartId => `/data/charts/${chartId}`,
            providesTags: (_result, _error, chartId) => [{ type: 'Charts', id: chartId }],
        }),
        deleteChart: builder.mutation<void, string>({
            query: chartId => ({
                url: `/data/charts/${chartId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, chartId) => [
                { type: 'Charts', id: chartId },
                { type: 'Charts', id: 'LIST' },
            ],
        }),
        getChartData: builder.query<ChartResponse, string | GetChartDataPayload>({
            query: arg => {
                const payload = typeof arg === 'string' ? { chartId: arg } : arg;

                return `/data/charts/${payload.chartId}/data${encodeFilterOverrides(payload.filterOverrides)}`;
            },
            providesTags: (_result, _error, arg) => [
                {
                    type: 'Charts',
                    id: typeof arg === 'string' ? arg : arg.chartId,
                },
            ],
        }),
    }),
});

export const {
    useDeleteChartMutation,
    useGetChartQuery,
    useLazyGetChartDataQuery,
    useLazyGetChartQuery,
    useListChartsQuery,
} = chartApi;
