import { Axis, BarSeries, Grid, XYChart, type EventHandlerParams } from '@visx/xychart';
import { useMemo, useState } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../../../../api';
import { DEFAULT_CHART_COLOR, mixChartColors } from '../../../../lib';
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
    shouldRotateBarAxisLabels,
    type BarFillVariant,
} from './barChartConfig';
import { ReferenceLine, ValueLabels } from './BarChartLayers';

type BarChartSingleInnerProps = {
    series: ChartSeries;
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

const getFillVariant = (
    point: ChartDataPoint,
    hovered: HoveredCartesianPoint,
    minValue: number,
    maxValue: number
): BarFillVariant => {
    if (hovered && (hovered.label ?? hovered.datum.label) !== point.label) {
        return 'dim';
    }

    if (maxValue !== minValue && point.value === maxValue) {
        return 'max';
    }

    if (maxValue !== minValue && point.value === minValue) {
        return 'min';
    }

    return 'normal';
};

const getSolidFill = (
    point: ChartDataPoint,
    variant: BarFillVariant,
    baseColor: string,
    minValue: number,
    maxValue: number
) => {
    if (variant === 'dim') {
        return mixChartColors(baseColor, C.surface, 0.52);
    }

    if (variant === 'max') {
        return mixChartColors(baseColor, C.onSurface, 0.16);
    }

    if (variant === 'min') {
        return mixChartColors(baseColor, '#000000', 0.18);
    }

    const range = maxValue - minValue;
    const lightness = range > 0 ? ((point.value - minValue) / range) * 0.12 : 0.04;

    return mixChartColors(baseColor, C.onSurface, lightness);
};

const BarChartSingleInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    width,
    height,
    showAxisTickLabels,
}: BarChartSingleInnerProps) => {
    const [hovered, setHovered] = useState<HoveredCartesianPoint>(null);
    const rotateLabels =
        showAxisTickLabels &&
        shouldRotateBarAxisLabels(labels, width, labelTimeGranularity);
    const values = useMemo(() => getValues([series]), [series]);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 1;
    const medianValue = getMedianValue(values);
    const margin = getBarChartMargin(rotateLabels, height, showAxisTickLabels);
    const seriesArr = useMemo(() => [series], [series]);
    const baseColor = getSeriesColor(color, 0);
    const xAxisTickLabels = showAxisTickLabels
        ? getAdaptiveAxisTickLabels({
              labels,
              availableSpace: Math.max(0, width - margin.left - margin.right),
              minSpacing: rotateLabels ? 48 : 72,
          })
        : [];

    const handlePointerMove = ({
        datum,
        key,
        svgPoint,
    }: EventHandlerParams<ChartDataPoint>) => {
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
                accessibilityLabel="Bar chart"
                width={width}
                height={height}
                margin={margin}
                theme={chartTheme}
                xScale={{ type: 'band', domain: labels, padding: 0.16 }}
                yScale={{
                    type: 'linear',
                    domain: [Math.min(0, minValue), Math.max(1, maxValue)],
                    nice: true,
                    zero: true,
                }}
                onPointerMove={handlePointerMove}
                onPointerOut={() => setHovered(null)}
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
                <BarSeries
                    dataKey={series.name}
                    data={series.points}
                    xAccessor={point => point.label}
                    yAccessor={point => point.value}
                    colorAccessor={point => {
                        const variant = getFillVariant(
                            point,
                            hovered,
                            minValue,
                            maxValue
                        );

                        return getSolidFill(
                            point,
                            variant,
                            baseColor,
                            minValue,
                            maxValue
                        );
                    }}
                    radius={4}
                    radiusTop
                />
                <ValueLabels series={seriesArr} valueFormat={valueFormat} />
            </XYChart>
            <CartesianChartTooltip hovered={hovered} series={seriesArr} maxWidth={220} />
        </div>
    );
};

type BarChartSingleProps = {
    series: ChartSeries;
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    height?: ChartFrameHeight;
    aspectRatioConstraint?: ChartAspectRatioConstraint;
    showAxisTickLabels?: boolean;
};

export const BarChartSingle = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
    height,
    aspectRatioConstraint,
    showAxisTickLabels = true,
}: BarChartSingleProps) => {
    const { ref, width, height: measuredHeight } = useRafChartSize();
    const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);
    const frame = getConstrainedChartFrameSize(width, chartHeight, aspectRatioConstraint);
    const chartContent = (
        <BarChartSingleInner
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
        <div ref={ref} style={getChartFrameStyle(height)}>
            {content}
        </div>
    );
};
