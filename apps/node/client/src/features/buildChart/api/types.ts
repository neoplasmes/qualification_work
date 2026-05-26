import type { ChartType, FilterClause } from '@/entities/chart';

export type Aggregate = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type AxisGrouping =
    | { kind: 'time'; granularity: TimeGranularity }
    | { kind: 'numeric'; step: number }
    | null;

export type CreateChartPayload = {
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: Record<string, unknown>;
};

export type CreateChartResponse = {
    id: string;
};

export type UpdateChartPayload = {
    chartId: string;
    name?: string;
    chartType?: ChartType;
    config?: Record<string, unknown>;
};

export type PreviewChartPayload = {
    datasetId: string;
    chartType: ChartType;
    config: Record<string, unknown>;
    filterOverrides?: FilterClause[];
};
