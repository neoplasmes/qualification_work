import type {
    Chart,
    ChartResponse,
    GetChartDataPayload,
} from '@qualification-work/types';

import { api, chartChangedTags, datasetRelationTagId } from '@/shared/api';

type ChartCacheTag = {
    type: 'Charts';
    id: string;
};

const getChartTags = (chart: Chart): ChartCacheTag[] => [
    { type: 'Charts', id: chart.id },
    { type: 'Charts', id: datasetRelationTagId(chart.datasetId) },
];

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
                    ? [...result.flatMap(getChartTags), { type: 'Charts', id: 'LIST' }]
                    : [{ type: 'Charts' as const, id: 'LIST' }],
        }),
        getChart: builder.query<Chart, string>({
            query: chartId => `/data/charts/${chartId}`,
            providesTags: (result, _error, chartId) => [
                { type: 'Charts', id: chartId },
                ...(result
                    ? [
                          {
                              type: 'Charts' as const,
                              id: datasetRelationTagId(result.datasetId),
                          },
                      ]
                    : []),
            ],
        }),
        deleteChart: builder.mutation<void, string>({
            query: chartId => ({
                url: `/data/charts/${chartId}`,
                method: 'DELETE',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, chartId) => chartChangedTags(chartId),
        }),
        getChartData: builder.query<ChartResponse, string | GetChartDataPayload>({
            query: arg => {
                const payload = typeof arg === 'string' ? { chartId: arg } : arg;

                return `/data/charts/${payload.chartId}/data${encodeFilterOverrides(payload.filterOverrides)}`;
            },
            keepUnusedDataFor: 300,
            providesTags: (_result, _error, arg) => [
                { type: 'ChartData', id: 'LIST' },
                {
                    type: 'ChartData',
                    id: typeof arg === 'string' ? arg : arg.chartId,
                },
            ],
        }),
    }),
});

export const {
    useDeleteChartMutation,
    useGetChartDataQuery,
    useGetChartQuery,
    useLazyGetChartDataQuery,
    useLazyGetChartQuery,
    useListChartsQuery,
} = chartApi;
