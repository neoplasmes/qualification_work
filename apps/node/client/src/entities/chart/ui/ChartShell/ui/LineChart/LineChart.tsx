import type { MeasureValueFormat, TimeGranularity } from '../../../../api';
import { DEFAULT_CHART_COLOR } from '../../../../lib';
import type { ChartSeries } from '../../../../lib/parseChartData';

import {
    getChartAspectFrameStyle,
    getChartFrameStyle,
    getConstrainedChartFrameSize,
    getResolvedChartFrameHeight,
    useRafChartSize,
    type ChartAspectRatioConstraint,
    type ChartFrameHeight,
} from '../../lib';
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
    aspectRatioConstraint?: ChartAspectRatioConstraint;
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
    aspectRatioConstraint,
    showAxisTickLabels = true,
    showLegend = false,
}: LineChartProps) => {
    const { ref, width, height: measuredHeight } = useRafChartSize();
    const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);
    const frame = getConstrainedChartFrameSize(width, chartHeight, aspectRatioConstraint);
    const chartContent = (
        <LineChartInner
            series={series}
            labels={labels}
            labelTimeGranularity={labelTimeGranularity}
            valueFormat={valueFormat}
            color={color}
            width={frame.width}
            height={frame.height}
            showAxisTickLabels={showAxisTickLabels}
        />
    );

    let content = null;
    if (width > 0 && chartHeight > 0) {
        content = aspectRatioConstraint ? (
            <div style={getChartAspectFrameStyle(chartHeight)}>{chartContent}</div>
        ) : (
            chartContent
        );
    }

    return (
        <div
            className={[styles['root'], height === 'fill' ? styles['height-fill'] : '']
                .filter(Boolean)
                .join(' ')}
        >
            <div ref={ref} style={getChartFrameStyle(height)}>
                {content}
            </div>

            {showLegend && <LineChartLegend series={series} color={color} />}
        </div>
    );
};
