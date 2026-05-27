import { ParentSize } from '@visx/responsive';

import type { MeasureValueFormat, TimeGranularity } from '../api';
import { DEFAULT_CHART_COLOR } from '../lib';
import type { ChartSeries } from '../lib/parseChartData';
import { CHART_HEIGHT, MIN_CHART_WIDTH } from './LineChart.config';
import { LineChartInner } from './LineChart.inner';
import { LineChartLegend } from './LineChartLegend';

import styles from './LineChart.module.scss';

type LineChartProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    showLegend?: boolean;
};

export const LineChart = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    showLegend = false,
}: LineChartProps) => (
    <div className={styles['root']}>
        <ParentSize style={{ height: CHART_HEIGHT }}>
            {({ width }) =>
                width >= MIN_CHART_WIDTH ? (
                    <LineChartInner
                        series={series}
                        labels={labels}
                        labelTimeGranularity={labelTimeGranularity}
                        valueFormat={valueFormat}
                        color={color}
                        width={width}
                        height={CHART_HEIGHT}
                    />
                ) : width > 0 ? (
                    <div style={{ height: CHART_HEIGHT }} />
                ) : null
            }
        </ParentSize>

        {showLegend && <LineChartLegend series={series} color={color} />}
    </div>
);
