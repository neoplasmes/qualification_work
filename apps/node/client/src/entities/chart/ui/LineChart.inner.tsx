import { curveMonotoneX } from '@visx/curve';
import {
    AreaSeries,
    Axis,
    GlyphSeries,
    XYChart,
    type EventHandlerParams,
} from '@visx/xychart';
import { useState } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../api';
import { formatAxisNumber, formatChartCell } from '../lib/formatChartCell';
import type { ChartSeries } from '../lib/parseChartData';
import {
    C,
    chartTheme,
    getSeriesColor,
    getValues,
    GLYPH_SERIES_SUFFIX,
    gradientId,
} from './LineChart.config';
import { LineChartTooltip, type HoveredLinePoint } from './LineChartTooltip';

type LineChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color: string;
    width: number;
    height: number;
};

export const LineChartInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color,
    width,
    height,
}: LineChartInnerProps) => {
    const [hovered, setHovered] = useState<HoveredLinePoint>(null);
    const rotateLabels = labels.length > 6;
    const values = getValues(series);
    const minValue = values.length ? Math.min(...values, 0) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;
    const margin = { top: 16, right: 16, bottom: rotateLabels ? 96 : 48, left: 64 };

    const handlePointerMove = ({
        datum,
        key,
        svgPoint,
    }: EventHandlerParams<ChartSeries['points'][number]>) => {
        setHovered({
            datum,
            seriesName: key,
            x: svgPoint?.x ?? 0,
            y: svgPoint?.y ?? 0,
        });
    };

    return (
        <div data-testid="line-chart-svg" style={{ position: 'relative' }}>
            <XYChart
                accessibilityLabel="Line chart"
                width={width}
                height={height}
                margin={margin}
                theme={chartTheme}
                onPointerMove={handlePointerMove}
                onPointerOut={() => setHovered(null)}
                xScale={{ type: 'point', domain: labels, padding: 0.1 }}
                yScale={{
                    type: 'linear',
                    domain: [Math.min(0, minValue), maxValue],
                    nice: true,
                    zero: true,
                }}
            >
                <Axis
                    orientation="left"
                    numTicks={5}
                    tickFormat={v => formatAxisNumber(Number(v), valueFormat)}
                />
                <Axis
                    orientation="bottom"
                    numTicks={labels.length}
                    tickFormat={v =>
                        formatChartCell(v, { timeGranularity: labelTimeGranularity })
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
                <defs>
                    {series.map((seriesItem, seriesIndex) => {
                        const seriesColor = getSeriesColor(color, seriesIndex);

                        return (
                            <linearGradient
                                key={seriesItem.name}
                                id={gradientId(seriesItem.name, seriesIndex)}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0"
                                    stopColor={seriesColor}
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="1"
                                    stopColor={seriesColor}
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                        );
                    })}
                </defs>
                {series.map((seriesItem, seriesIndex) => {
                    const seriesColor = getSeriesColor(color, seriesIndex);

                    return (
                        <g key={seriesItem.name}>
                            <AreaSeries
                                dataKey={seriesItem.name}
                                data={seriesItem.points}
                                xAccessor={point => point.label}
                                yAccessor={point => point.value}
                                fill={`url(#${gradientId(seriesItem.name, seriesIndex)})`}
                                curve={curveMonotoneX}
                                renderLine
                                lineProps={{
                                    stroke: seriesColor,
                                    strokeWidth: 2,
                                }}
                            />
                            <GlyphSeries
                                dataKey={`${seriesItem.name}${GLYPH_SERIES_SUFFIX}`}
                                data={seriesItem.points}
                                xAccessor={point => point.label}
                                yAccessor={point => point.value}
                                colorAccessor={() => seriesColor}
                                renderGlyph={({ key, x, y, color: glyphColor }) => (
                                    <circle
                                        key={key}
                                        cx={x}
                                        cy={y}
                                        r={4}
                                        fill={glyphColor}
                                        stroke={C.surfaceHigh}
                                        strokeWidth={1.5}
                                        style={{ cursor: 'crosshair' }}
                                    />
                                )}
                            />
                        </g>
                    );
                })}
            </XYChart>
            <LineChartTooltip
                hovered={hovered}
                series={series}
                color={color}
                width={width}
            />
        </div>
    );
};
