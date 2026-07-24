import type {
    Chart,
    ChartConfig,
    ChartData,
    ChartType,
    FilterClause,
} from '@/core/entities/chart';

import type { ReadOptions } from '../readOptions';

export type ListChartsInput = { orgId: string };
export type ChartScope = ListChartsInput & { chartId: string };
export type GetChartDataInput = ChartScope & { filterOverrides?: FilterClause[] };
export type PreviewChartDataInput = ListChartsInput & {
    datasetId: string;
    chartType: ChartType;
    config: ChartConfig;
    filterOverrides?: FilterClause[];
};
export type CreateChartInput = Omit<PreviewChartDataInput, 'filterOverrides'> & {
    name: string;
};
export type CreateChartResult = { id: string };
export type UpdateChartInput = ChartScope & {
    name?: string;
    chartType?: ChartType;
    config?: ChartConfig;
};
export type PatchChartInput = UpdateChartInput;

export interface ChartRepo {
    listCharts(input: ListChartsInput, options?: ReadOptions): Promise<Chart[]>;
    getChart(input: ChartScope, options?: ReadOptions): Promise<Chart>;
    getChartData(input: GetChartDataInput, options?: ReadOptions): Promise<ChartData>;
    previewChartData(
        input: PreviewChartDataInput,
        options?: ReadOptions
    ): Promise<ChartData>;
    createChart(input: CreateChartInput): Promise<CreateChartResult>;
    updateChart(input: UpdateChartInput): Promise<void>;
    patchChart(input: PatchChartInput): Promise<void>;
    deleteChart(input: ChartScope): Promise<void>;
}
