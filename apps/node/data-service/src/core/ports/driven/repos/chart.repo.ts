import type { ChartConfig, ChartType } from '@qualification-work/types';

import type { Chart } from '@/core/domain';

export type CreateChartPayload = {
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: ChartConfig;
};

export type UpdateChartPayload = {
    name?: string;
    chartType?: ChartType;
    config?: ChartConfig;
};

// Used by the compiler: contains dataset_id, data_version (for future cache keys), and column metadata.
export type ChartCompilationContext = {
    chart: Chart;
    datasetId: string;
    dataVersion: number;
    columns: Array<{
        id: string;
        key: string;
        dataType: 'number' | 'string' | 'date' | 'bool';
    }>;
};

export interface ChartRepo {
    create(data: CreateChartPayload): Promise<{ id: string }>;

    update(chartId: string, data: UpdateChartPayload): Promise<void>;

    getById(chartId: string): Promise<Chart | null>;

    getByOrgId(orgId: string): Promise<Chart[]>;

    delete(chartId: string): Promise<void>;

    getCompilationContext(chartId: string): Promise<ChartCompilationContext | null>;
}
