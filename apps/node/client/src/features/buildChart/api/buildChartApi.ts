import type { ChartResponse } from '@qualification-work/types';

import {
    api,
    chartChangedTags,
    chartCreatedTags,
    chartRelationTagId,
    type CacheInvalidationTag,
} from '@/shared/api';

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
            invalidatesTags: (_result, _error, arg) => chartCreatedTags(arg.datasetId),
        }),
        updateChart: builder.mutation<void, UpdateChartPayload>({
            query: ({ chartId, ...body }) => ({
                url: `/data/charts/${chartId}`,
                method: 'PUT',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => chartChangedTags(arg.chartId),
        }),
        patchChart: builder.mutation<void, PatchChartPayload>({
            query: ({ chartId, ...body }) => ({
                url: `/data/charts/${chartId}`,
                method: 'PATCH',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => {
                const tags: CacheInvalidationTag[] = [
                    { type: 'Charts', id: arg.chartId },
                    { type: 'Charts', id: 'LIST' },
                    { type: 'Dashboards', id: chartRelationTagId(arg.chartId) },
                ];

                if (arg.chartType || arg.config) {
                    tags.push({ type: 'ChartData', id: arg.chartId });
                }

                return tags;
            },
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
