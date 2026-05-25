import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scalePoint } from '@visx/scale';
import { Line, LinePath } from '@visx/shape';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';

import { formatAxisNumber, formatChartCell } from '../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../lib/parseChartData';

const C = {
    primary: '#872557',
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surface: '#1a1a1a',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const CHART_HEIGHT = 360;
const MIN_CHART_WIDTH = 180;
const SERIES_COLORS = ['#872557', '#c85080', '#4a8f8f', '#d09a3a', '#7c6bc4', '#78a95a'];

type LineChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    width: number;
    height: number;
};

const LineChartInner = ({ series, labels, width, height }: LineChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<ChartDataPoint & { series: string }>();

    const rotateLabels = labels.length > 6;
    const margin = { top: 16, right: 16, bottom: rotateLabels ? 96 : 48, left: 64 };
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const xScale = scalePoint<string>({
        range: [0, xMax],
        domain: labels,
        padding: 0.1,
    });

    const values = series
        .flatMap(item => item.points.map(point => point.value))
        .filter(Number.isFinite);
    const minValue = values.length ? Math.min(...values, 0) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;

    const yScale = scaleLinear<number>({
        range: [yMax, 0],
        domain: [Math.min(0, minValue), maxValue],
        nice: true,
    });

    const showZeroLine = minValue < 0 || maxValue >= 0;
    const zeroY = yScale(0);

    return (
        <div style={{ position: 'relative' }}>
            <svg
                width={width}
                height={height}
                role="img"
                aria-label="Line chart"
                data-testid="line-chart-svg"
            >
                <Group left={margin.left} top={margin.top}>
                    <AxisLeft
                        scale={yScale}
                        numTicks={5}
                        tickFormat={v => formatAxisNumber(Number(v))}
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 11,
                            textAnchor: 'end' as const,
                            dx: '-0.25em',
                            dy: '0.33em',
                        })}
                        tickStroke={C.outline}
                        stroke={C.outline}
                    />
                    <AxisBottom
                        top={yMax}
                        scale={xScale}
                        numTicks={labels.length}
                        tickFormat={v => formatChartCell(v)}
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 11,
                            textAnchor: rotateLabels ? ('end' as const) : ('middle' as const),
                            angle: rotateLabels ? -45 : 0,
                            dx: rotateLabels ? '-0.25em' : '0',
                            dy: rotateLabels ? '0.25em' : '0.33em',
                        })}
                        tickStroke={C.outline}
                        stroke={C.outline}
                    />
                    {showZeroLine && (
                        <Line
                            from={{ x: 0, y: zeroY }}
                            to={{ x: xMax, y: zeroY }}
                            stroke={C.outline}
                            strokeWidth={1}
                        />
                    )}
                    {series.map((seriesItem, seriesIndex) => {
                        const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];

                        return (
                            <g key={seriesItem.name}>
                                <LinePath<ChartDataPoint>
                                    data={seriesItem.points}
                                    x={d => xScale(d.label) ?? 0}
                                    y={d => yScale(d.value)}
                                    stroke={color}
                                    strokeWidth={2}
                                    curve={curveMonotoneX}
                                />
                                {seriesItem.points.map(point => (
                                    <circle
                                        key={`${seriesItem.name}:${point.label}`}
                                        cx={xScale(point.label) ?? 0}
                                        cy={yScale(point.value)}
                                        r={4}
                                        fill={color}
                                        stroke={C.surfaceHigh}
                                        strokeWidth={1.5}
                                        style={{ cursor: 'crosshair' }}
                                        onMouseMove={event => {
                                            const cursorPoint = localPoint(event);
                                            showTooltip({
                                                tooltipData: {
                                                    ...point,
                                                    series: seriesItem.name,
                                                },
                                                tooltipLeft: cursorPoint?.x,
                                                tooltipTop: cursorPoint?.y,
                                            });
                                        }}
                                        onMouseLeave={hideTooltip}
                                    />
                                ))}
                            </g>
                        );
                    })}
                </Group>
            </svg>
            {tooltipOpen && tooltipData && (
                <TooltipWithBounds
                    left={tooltipLeft}
                    top={tooltipTop}
                    style={{
                        ...defaultStyles,
                        background: C.surfaceHigh,
                        color: C.onSurface,
                        border: `1px solid ${C.outline}`,
                        fontSize: 12,
                    }}
                >
                    <strong>{formatChartCell(tooltipData.label)}</strong>
                    {series.length > 1 ? ` / ${tooltipData.series}` : ''}:{' '}
                    {formatChartCell(tooltipData.value)}
                </TooltipWithBounds>
            )}
        </div>
    );
};

type LineChartProps = {
    series: ChartSeries[];
    labels: string[];
};

export const LineChart = ({ series, labels }: LineChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <LineChartInner
                    series={series}
                    labels={labels}
                    width={width}
                    height={CHART_HEIGHT}
                />
            ) : width > 0 ? (
                <div style={{ height: CHART_HEIGHT }} />
            ) : null
        }
    </ParentSize>
);
