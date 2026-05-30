import type {
    Aggregate,
    AxisGrouping,
    CreateChartPayload,
    CreateChartResponse,
    MeasureValueFormat,
    PreviewChartPayload,
    TimeGranularity,
    UpdateChartPayload as UpdateChartBodyPayload,
} from '@qualification-work/types';

export type {
    Aggregate,
    AxisGrouping,
    CreateChartPayload,
    CreateChartResponse,
    MeasureValueFormat,
    PreviewChartPayload,
    TimeGranularity,
};

export type UpdateChartPayload = UpdateChartBodyPayload & {
    chartId: string;
};

export type PatchChartPayload = UpdateChartPayload;
