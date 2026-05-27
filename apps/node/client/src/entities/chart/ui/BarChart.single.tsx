import { ParentSize } from '@visx/responsive';
import { Axis, BarSeries, Grid, XYChart, type EventHandlerParams } from '@visx/xychart';
import { useMemo, useState } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../api';
import { DEFAULT_CHART_COLOR, mixChartColors } from '../lib';
import { formatAxisNumber } from '../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../lib/parseChartData';
import {
    C,
    CHART_HEIGHT,
    chartTheme,
    formatBarAxisLabel,
    getMedianValue,
    getSeriesColor,
    getValues,
    MIN_CHART_WIDTH,
    shouldRotateBarAxisLabels,
    type BarFillVariant,
} from './BarChart.config';
import { ReferenceLine, ValueLabels } from './BarChart.layers';
import { BarChartTooltip, type HoveredBar } from './BarChartTooltip';

type BarChartSingleInnerProps = {
    series: ChartSeries;
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
    width: number;
    height: number;
};

const getFillVariant = (
    point: ChartDataPoint,
    hovered: HoveredBar,
    minValue: number,
    maxValue: number
): BarFillVariant => {
    if (hovered && hovered.label !== point.label) {
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
}: BarChartSingleInnerProps) => {
    const [hovered, setHovered] = useState<HoveredBar>(null);
    const rotateLabels = shouldRotateBarAxisLabels(labels, width, labelTimeGranularity);
    const values = useMemo(() => getValues([series]), [series]);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 1;
    const medianValue = getMedianValue(values);
    const margin = { top: 32, right: 16, bottom: rotateLabels ? 112 : 48, left: 64 };
    const seriesArr = useMemo(() => [series], [series]);
    const baseColor = getSeriesColor(color, 0);

    const handlePointerMove = ({
        datum,
        key,
        svgPoint,
    }: EventHandlerParams<ChartDataPoint>) => {
        setHovered({
            datum,
            label: datum.label,
            seriesName: key,
            x: svgPoint?.x ?? 0,
            y: svgPoint?.y ?? 0,
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
                    tickFormat={v => formatAxisNumber(Number(v), valueFormat)}
                />
                <Axis
                    orientation="bottom"
                    numTicks={labels.length}
                    tickFormat={v =>
                        formatBarAxisLabel(v, rotateLabels, labelTimeGranularity)
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
            <BarChartTooltip hovered={hovered} series={seriesArr} width={width} />
        </div>
    );
};

type BarChartSingleProps = {
    series: ChartSeries;
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color?: string;
};

export const BarChartSingle = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color = DEFAULT_CHART_COLOR,
}: BarChartSingleProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <BarChartSingleInner
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
);
