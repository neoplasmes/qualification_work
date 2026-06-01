import { curveMonotoneX } from '@visx/curve';
import {
    AreaSeries,
    Axis,
    GlyphSeries,
    XYChart,
    type EventHandlerParams,
} from '@visx/xychart';
import { useState } from 'react';

import type { MeasureValueFormat, TimeGranularity } from '../../../../api';
import { formatAxisNumber, formatChartCell } from '../../../../lib/formatChartCell';
import type { ChartSeries } from '../../../../lib/parseChartData';

import { getAdaptiveAxisTickLabels, getChartTooltipPoint } from '../../lib';
import {
    CartesianChartTooltip,
    type HoveredCartesianPoint,
} from '../CartesianChartTooltip';
import {
    C,
    chartTheme,
    getSeriesColor,
    getValues,
    GLYPH_SERIES_SUFFIX,
    gradientId,
    stripGlyphSeriesSuffix,
} from './lineChartConfig';

type LineChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    labelTimeGranularity?: TimeGranularity;
    valueFormat?: MeasureValueFormat;
    color: string;
    width: number;
    height: number;
    showAxisTickLabels: boolean;
};

const getLineChartMargin = (
    rotateLabels: boolean,
    height: number,
    showAxisTickLabels: boolean
) => {
    if (!showAxisTickLabels) {
        return { top: 8, right: 8, bottom: 12, left: 12 };
    }

    const compact = height < 260;

    return {
        top: compact ? 12 : 16,
        right: 16,
        bottom: rotateLabels
            ? Math.min(96, Math.max(52, height * 0.32))
            : Math.min(48, Math.max(32, height * 0.2)),
        left: compact ? 52 : 64,
    };
};

export const LineChartInner = ({
    series,
    labels,
    labelTimeGranularity,
    valueFormat,
    color,
    width,
    height,
    showAxisTickLabels,
}: LineChartInnerProps) => {
    const [hovered, setHovered] = useState<HoveredCartesianPoint>(null);
    const rotateLabels = showAxisTickLabels && labels.length > 6;
    const values = getValues(series);
    const minValue = values.length ? Math.min(...values, 0) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;
    const margin = getLineChartMargin(rotateLabels, height, showAxisTickLabels);
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
    }: EventHandlerParams<ChartSeries['points'][number]>) => {
        setHovered({
            datum,
            seriesName: key,
            point: getChartTooltipPoint(event, svgPoint),
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
                            ? formatChartCell(v, {
                                  timeGranularity: labelTimeGranularity,
                              })
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
            <CartesianChartTooltip
                hovered={hovered}
                series={series}
                maxWidth={240}
                normalizeSeriesName={stripGlyphSeriesSuffix}
                getSeriesColor={(_seriesName, seriesIndex) =>
                    getSeriesColor(color, seriesIndex)
                }
            />
        </div>
    );
};
