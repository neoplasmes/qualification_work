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
    getAdaptiveAxisTickLabels,
    getChartAspectFrameStyle,
    getChartFrameStyle,
    getChartTooltipPoint,
    getConstrainedChartFrameSize,
    getResolvedChartFrameHeight,
    useRafChartSize,
    type ChartAspectRatioConstraint,
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
    shouldHideGroupedBarXAxisLabels,
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
    showAxisTickLabels: boolean,
    showXAxisTickLabels = showAxisTickLabels
) => {
    if (!showAxisTickLabels) {
        return { top: 12, right: 8, bottom: 12, left: 12 };
    }

    const compact = height < 260;

    return {
        top: compact ? 16 : 32,
        right: 16,
        bottom: showXAxisTickLabels
            ? rotateLabels
                ? Math.min(112, Math.max(56, height * 0.34))
                : Math.min(48, Math.max(32, height * 0.2))
            : 16,
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
    const initialMargin = getBarChartMargin(rotateLabels, height, showAxisTickLabels);
    const showXAxisTickLabels =
        showAxisTickLabels &&
        !shouldHideGroupedBarXAxisLabels(
            labels,
            width,
            height,
            initialMargin.bottom,
            labelTimeGranularity
        );
    const effectiveRotateLabels = showXAxisTickLabels && rotateLabels;
    const values = useMemo(() => getValues(series), [series]);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 1;
    const medianValue = getMedianValue(values);
    const margin = getBarChartMargin(
        effectiveRotateLabels,
        height,
        showAxisTickLabels,
        showXAxisTickLabels
    );
    const xAxisTickLabels = showXAxisTickLabels
        ? getAdaptiveAxisTickLabels({
              labels,
              availableSpace: Math.max(0, width - margin.left - margin.right),
              minSpacing: effectiveRotateLabels ? 48 : 72,
          })
        : [];

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
                    numTicks={xAxisTickLabels.length}
                    tickValues={xAxisTickLabels}
                    tickFormat={v =>
                        showXAxisTickLabels
                            ? formatBarAxisLabel(
                                  v,
                                  effectiveRotateLabels,
                                  labelTimeGranularity
                              )
                            : ''
                    }
                    tickLabelProps={() => ({
                        fill: C.muted,
                        fontSize: 11,
                        textAnchor: effectiveRotateLabels ? 'end' : 'middle',
                        angle: effectiveRotateLabels ? -45 : 0,
                        dx: effectiveRotateLabels ? '-0.25em' : '0',
                        dy: effectiveRotateLabels ? '0.25em' : '0.33em',
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
    aspectRatioConstraint?: ChartAspectRatioConstraint;
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
    aspectRatioConstraint,
    showAxisTickLabels = true,
    showLegend = false,
}: BarChartGroupedProps) => {
    const { ref, width, height: measuredHeight } = useRafChartSize();
    const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);
    const frame = getConstrainedChartFrameSize(width, chartHeight, aspectRatioConstraint);
    const chartContent = (
        <BarChartGroupedInner
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

            {showLegend && <BarChartLegend series={series} color={color} />}
        </div>
    );
};
