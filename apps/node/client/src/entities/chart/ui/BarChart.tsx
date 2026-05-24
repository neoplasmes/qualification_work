import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';

import { formatChartCell } from '../lib/formatChartCell';
import type { ChartSeries } from '../lib/parseChartData';

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

type BarChartInnerProps = {
    series: ChartSeries[];
    labels: string[];
    width: number;
    height: number;
};

const BarChartInner = ({ series, labels, width, height }: BarChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<{ label: string; series: string; value: number }>();

    const rotateLabels = labels.length > 6;
    const margin = {
        top: 16,
        right: 16,
        bottom: rotateLabels ? 96 : 48,
        left: 52,
    };

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const xScale = scaleBand<string>({
        range: [0, xMax],
        domain: labels,
        padding: 0.3,
    });
    const seriesNames = series.map(item => item.name);
    const seriesScale = scaleBand<string>({
        range: [0, xScale.bandwidth()],
        domain: seriesNames,
        padding: 0.12,
    });
    const values = series
        .flatMap(item => item.points.map(point => point.value))
        .filter(Number.isFinite);
    const minValue = values.length ? Math.min(...values, 0) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;

    const yScale = scaleLinear<number>({
        range: [yMax, 0],
        domain: [minValue, maxValue],
        nice: true,
    });
    const zeroY = yScale(0);

    const tickLabelProps = () =>
        ({
            fill: C.muted,
            fontSize: 11,
            textAnchor: rotateLabels ? ('end' as const) : ('middle' as const),
            angle: rotateLabels ? -45 : 0,
            dx: rotateLabels ? '-0.25em' : '0',
            dy: rotateLabels ? '0.25em' : '0.33em',
        }) as const;

    return (
        <div style={{ position: 'relative' }}>
            <svg
                width={width}
                height={height}
                role="img"
                aria-label="Bar chart"
                data-testid="bar-chart-svg"
            >
                <Group left={margin.left} top={margin.top}>
                    <AxisLeft
                        scale={yScale}
                        numTicks={5}
                        tickFormat={v => formatChartCell(v)}
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
                        tickLabelProps={tickLabelProps}
                        tickStroke={C.outline}
                        stroke={C.outline}
                    />
                    <line x1={0} x2={xMax} y1={zeroY} y2={zeroY} stroke={C.outline} />
                    {series.map((seriesItem, seriesIndex) =>
                        seriesItem.points.map(point => {
                            const groupX = xScale(point.label) ?? 0;
                            const barX =
                                series.length > 1
                                    ? groupX + (seriesScale(seriesItem.name) ?? 0)
                                    : groupX;
                            const valueY = yScale(point.value);
                            const barY = Math.min(valueY, zeroY);
                            const barWidth =
                                series.length > 1 ? seriesScale.bandwidth() : xScale.bandwidth();
                            const barHeight = Math.abs(zeroY - valueY);

                            return (
                                <Bar
                                    key={`${seriesItem.name}:${point.label}`}
                                    x={barX}
                                    y={barY}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                                    rx={2}
                                    onMouseMove={event => {
                                        const cursorPoint = localPoint(event);
                                        showTooltip({
                                            tooltipData: {
                                                label: point.label,
                                                series: seriesItem.name,
                                                value: point.value,
                                            },
                                            tooltipLeft: cursorPoint?.x,
                                            tooltipTop: cursorPoint?.y,
                                        });
                                    }}
                                    onMouseLeave={hideTooltip}
                                />
                            );
                        })
                    )}
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
                    <strong>{tooltipData.label}</strong>
                    {series.length > 1 ? ` / ${tooltipData.series}` : ''}:{' '}
                    {formatChartCell(tooltipData.value)}
                </TooltipWithBounds>
            )}
        </div>
    );
};

type BarChartProps = {
    series: ChartSeries[];
    labels: string[];
};

export const BarChart = ({ series, labels }: BarChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <BarChartInner
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
