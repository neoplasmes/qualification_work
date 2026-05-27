import type { MeasureValueFormat, TimeGranularity } from '../api';
import type { ChartSeries } from '../lib/parseChartData';
import { BarChartGrouped } from './BarChart.grouped';
import { BarChartSingle } from './BarChart.single';

type BarChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
};

export const BarChart = ({ series, ...rest }: BarChartProps) =>
    series.length === 1 ? (
        <BarChartSingle series={series[0]} {...rest} />
    ) : (
        <BarChartGrouped series={series} {...rest} />
    );
