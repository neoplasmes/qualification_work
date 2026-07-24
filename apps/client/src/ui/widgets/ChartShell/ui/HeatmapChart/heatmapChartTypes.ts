import type { ChartResultColumn, TimeGranularity } from '@/core/entities/chart';

export type HeatmapCell = {
    x: string;
    y: string;
    value: number;
    xType?: ChartResultColumn['type'];
    yType?: ChartResultColumn['type'];
    xTimeGranularity?: TimeGranularity;
    yTimeGranularity?: TimeGranularity;
    valueFormat?: string;
};
