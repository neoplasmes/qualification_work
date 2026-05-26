import type { ChartResponse } from '@/entities/chart';

import { api } from '@/shared/api';

import type {
    CreateChartPayload,
    CreateChartResponse,
    PatchChartPayload,
    PreviewChartPayload,
    UpdateChartPayload,
} from './types';

export const buildChartApi = api.injectEndpoints({
    endpoints: builder => ({
        createChart: builder.mutation<CreateChartResponse, CreateChartPayload>({
            query: body => ({
                url: '/data/charts',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Charts'],
        }),
        updateChart: builder.mutation<void, UpdateChartPayload>({
            query: ({ chartId, ...body }) => ({
                url: `/data/charts/${chartId}`,
                method: 'PUT',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Charts', id: arg.chartId },
                { type: 'Charts', id: 'LIST' },
            ],
        }),
        patchChart: builder.mutation<void, PatchChartPayload>({
            query: ({ chartId, ...body }) => ({
                url: `/data/charts/${chartId}`,
                method: 'PATCH',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Charts', id: arg.chartId },
                { type: 'Charts', id: 'LIST' },
            ],
        }),
        previewChartData: builder.mutation<ChartResponse, PreviewChartPayload>({
            query: body => ({
                url: '/data/charts/preview',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useCreateChartMutation,
    usePatchChartMutation,
    usePreviewChartDataMutation,
    useUpdateChartMutation,
} = buildChartApi;
