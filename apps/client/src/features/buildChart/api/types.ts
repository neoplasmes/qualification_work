import type { UpdateChartPayload as UpdateChartBodyPayload } from '@qualification-work/types';

export type UpdateChartPayload = UpdateChartBodyPayload & {
    chartId: string;
};

export type PatchChartPayload = UpdateChartPayload;
