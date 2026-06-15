import type {
    ChartResultColumn,
    MeasureValueFormat,
    TimeGranularity,
} from '@qualification-work/types';

export type HeatmapCell = {
    x: string;
    y: string;
    value: number;
    xType?: ChartResultColumn['type'];
    yType?: ChartResultColumn['type'];
    xTimeGranularity?: TimeGranularity;
    yTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
};
