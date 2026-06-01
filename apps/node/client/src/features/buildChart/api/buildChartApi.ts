import type { ChartResponse } from '@qualification-work/types';

import { api } from '@/shared/api';

import type {
    CreateChartPayload,
    CreateChartResponse,
    PatchChartPayload,
    PreviewChartPayload,
    UpdateChartPayload,
} from './types';

type ChartInvalidationTag = {
    type: 'Charts' | 'ChartData';
    id: string;
};

const chartDataChangingTags = (chartId: string) =>
    [
        { type: 'Charts', id: chartId },
        { type: 'Charts', id: 'LIST' },
        { type: 'ChartData', id: chartId },
    ] satisfies ChartInvalidationTag[];

export const buildChartApi = api.injectEndpoints({
    endpoints: builder => ({
        createChart: builder.mutation<CreateChartResponse, CreateChartPayload>({
            query: body => ({
                url: '/data/charts',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Charts', id: 'LIST' }],
        }),
        updateChart: builder.mutation<void, UpdateChartPayload>({
            query: ({ chartId, ...body }) => ({
                url: `/data/charts/${chartId}`,
                method: 'PUT',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => chartDataChangingTags(arg.chartId),
        }),
        patchChart: builder.mutation<void, PatchChartPayload>({
            query: ({ chartId, ...body }) => ({
                url: `/data/charts/${chartId}`,
                method: 'PATCH',
                body,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, arg) => {
                const tags: ChartInvalidationTag[] = [
                    { type: 'Charts', id: arg.chartId },
                    { type: 'Charts', id: 'LIST' },
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
