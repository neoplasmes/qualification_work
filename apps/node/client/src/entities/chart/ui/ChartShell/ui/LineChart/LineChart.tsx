import { ParentSize } from '@visx/responsive';

import type { MeasureValueFormat, TimeGranularity } from '../../../../api';
import { DEFAULT_CHART_COLOR } from '../../../../lib';
import type { ChartSeries } from '../../../../lib/parseChartData';

import {
    getChartFrameStyle,
    getResolvedChartFrameHeight,
    type ChartFrameHeight,
} from '../../lib';
import { MIN_CHART_WIDTH } from './lineChartConfig';
import { LineChartInner } from './LineChartInner';
import { LineChartLegend } from './LineChartLegend';

import styles from './LineChart.module.scss';

type LineChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    height?: ChartFrameHeight;
    showAxisTickLabels?: boolean;
    showLegend?: boolean;
};

export const LineChart = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    height,
    showAxisTickLabels = true,
    showLegend = false,
}: LineChartProps) => (
    <div
        className={[styles['root'], height === 'fill' ? styles['height-fill'] : '']
            .filter(Boolean)
            .join(' ')}
    >
        <ParentSize style={getChartFrameStyle(height)}>
            {({ width, height: measuredHeight }) => {
                const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);

                return width >= MIN_CHART_WIDTH && chartHeight > 0 ? (
                    <LineChartInner
                        series={series}
                        labels={labels}
                        labelTimeGranularity={labelTimeGranularity}
                        valueFormat={valueFormat}
                        color={color}
                        width={width}
                        height={chartHeight}
                        showAxisTickLabels={showAxisTickLabels}
                    />
                ) : width > 0 ? (
                    <div style={{ height: chartHeight }} />
                ) : null;
            }}
        </ParentSize>

        {showLegend && <LineChartLegend series={series} color={color} />}
    </div>
);
