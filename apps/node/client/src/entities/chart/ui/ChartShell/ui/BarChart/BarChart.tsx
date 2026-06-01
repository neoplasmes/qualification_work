import type { MeasureValueFormat, TimeGranularity } from '../../../../api';
import type { ChartSeries } from '../../../../lib/parseChartData';

import type { ChartAspectRatioConstraint, ChartFrameHeight } from '../../lib';
import { BarChartGrouped } from './BarChartGrouped';
import { BarChartSingle } from './BarChartSingle';

type BarChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    height?: ChartFrameHeight;
    aspectRatioConstraint?: ChartAspectRatioConstraint;
    showAxisTickLabels?: boolean;
    showLegend?: boolean;
};

export const BarChart = ({ series, showLegend, ...rest }: BarChartProps) =>
    series.length === 1 ? (
        <BarChartSingle series={series[0]} {...rest} />
    ) : (
        <BarChartGrouped series={series} showLegend={showLegend} {...rest} />
    );
