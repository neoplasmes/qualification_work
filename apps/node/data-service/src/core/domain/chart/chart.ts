import type { ChartConfig, ChartType } from '@qualification-work/types';

export type Chart = {
    id: string;
    orgId: string;
    datasetId: string;
    name: string;
    chartType: ChartType;
    config: ChartConfig;
    createdAt: Date;
    updatedAt: Date;
};
