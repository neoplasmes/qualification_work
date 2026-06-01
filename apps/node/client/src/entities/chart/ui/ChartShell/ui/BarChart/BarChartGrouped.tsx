import { ParentSize } from '@visx/responsive';
import {
    Axis,
    BarGroup,
    BarSeries,
    Grid,
    XYChart,
    type EventHandlerParams,
} from '@visx/xychart';
import { useMemo, useState } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../../../../api';
import { DEFAULT_CHART_COLOR } from '../../../../lib';
import { formatAxisNumber } from '../../../../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../../../../lib/parseChartData';

import {
    getChartFrameStyle,
    getChartTooltipPoint,
    getResolvedChartFrameHeight,
    type ChartFrameHeight,
} from '../../lib';
import {
    CartesianChartTooltip,
    type HoveredCartesianPoint,
} from '../CartesianChartTooltip';
import {
    C,
    chartTheme,
    formatBarAxisLabel,
    getMedianValue,
    getSeriesColor,
    getValues,
    GROUP_PADDING,
    MIN_CHART_WIDTH,
    shouldRotateBarAxisLabels,
} from './barChartConfig';
import { ReferenceLine, ValueLabels } from './BarChartLayers';
import { BarChartLegend } from './BarChartLegend';

import styles from './BarChart.module.scss';

type BarChartGroupedInnerProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    width: number;
    height: number;
    showAxisTickLabels: boolean;
};

const getBarChartMargin = (
    rotateLabels: boolean,
    height: number,
    showAxisTickLabels: boolean
) => {
    if (!showAxisTickLabels) {
        return { top: 12, right: 8, bottom: 12, left: 12 };
    }

    const compact = height < 260;

    return {
        top: compact ? 16 : 32,
        right: 16,
        bottom: rotateLabels
            ? Math.min(112, Math.max(56, height * 0.34))
            : Math.min(48, Math.max(32, height * 0.2)),
        left: compact ? 52 : 64,
    };
};

const BarChartGroupedInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    width,
    height,
    showAxisTickLabels,
}: BarChartGroupedInnerProps) => {
    const [hovered, setHovered] = useState<HoveredCartesianPoint>(null);
    const rotateLabels =
        showAxisTickLabels &&
        shouldRotateBarAxisLabels(labels, width, labelTimeGranularity);
    const values = useMemo(() => getValues(series), [series]);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 1;
    const medianValue = getMedianValue(values);
    const margin = getBarChartMargin(rotateLabels, height, showAxisTickLabels);

    const handlePointerMove = ({
        datum,
        distanceX,
        key,
        svgPoint,
    }: EventHandlerParams<ChartDataPoint>) => {
        if (distanceX !== 0) {
            return;
        }

        setHovered({
            datum,
            label: datum.label,
            seriesName: key,
            point: getChartTooltipPoint(event, svgPoint),
        });
    };

    return (
        <div data-testid="bar-chart-svg" style={{ position: 'relative' }}>
            <XYChart
                accessibilityLabel="Grouped bar chart"
                width={width}
                height={height}
                margin={margin}
                theme={chartTheme}
                captureEvents={false}
                xScale={{ type: 'band', domain: labels, padding: 0.16 }}
                yScale={{
                    type: 'linear',
                    domain: [Math.min(0, minValue), Math.max(1, maxValue)],
                    nice: true,
                    zero: true,
                }}
            >
                <Grid columns={false} rows numTicks={4} stroke={C.grid} />
                <ReferenceLine value={medianValue} />
                <Axis
                    orientation="left"
                    numTicks={4}
                    tickFormat={v =>
                        showAxisTickLabels ? formatAxisNumber(Number(v), valueFormat) : ''
                    }
                />
                <Axis
                    orientation="bottom"
                    numTicks={labels.length}
                    tickFormat={v =>
                        showAxisTickLabels
                            ? formatBarAxisLabel(v, rotateLabels, labelTimeGranularity)
                            : ''
                    }
                    tickLabelProps={() => ({
                        fill: C.muted,
                        fontSize: 11,
                        textAnchor: rotateLabels ? 'end' : 'middle',
                        angle: rotateLabels ? -45 : 0,
                        dx: rotateLabels ? '-0.25em' : '0',
                        dy: rotateLabels ? '0.25em' : '0.33em',
                    })}
                />
                <BarGroup
                    padding={GROUP_PADDING}
                    onPointerMove={handlePointerMove}
                    onPointerOut={() => setHovered(null)}
                >
                    {series.map((seriesItem, seriesIndex) => (
                        <BarSeries
                            key={seriesItem.name}
                            dataKey={seriesItem.name}
                            data={seriesItem.points}
                            xAccessor={point => point.label}
                            yAccessor={point => point.value}
                            colorAccessor={() => getSeriesColor(color, seriesIndex)}
                            radius={4}
                            radiusTop
                        />
                    ))}
                </BarGroup>
                <ValueLabels series={series} valueFormat={valueFormat} />
            </XYChart>
            <CartesianChartTooltip hovered={hovered} series={series} maxWidth={220} />
        </div>
    );
};

type BarChartGroupedProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    height?: ChartFrameHeight;
    showAxisTickLabels?: boolean;
    showLegend?: boolean;
};

export const BarChartGrouped = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    height,
    showAxisTickLabels = true,
    showLegend = false,
}: BarChartGroupedProps) => (
    <div
        className={[styles['root'], height === 'fill' ? styles['height-fill'] : '']
            .filter(Boolean)
            .join(' ')}
    >
        <ParentSize style={getChartFrameStyle(height)}>
            {({ width, height: measuredHeight }) => {
                const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);

                return width >= MIN_CHART_WIDTH && chartHeight > 0 ? (
                    <BarChartGroupedInner
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

        {showLegend && <BarChartLegend series={series} color={color} />}
    </div>
);
