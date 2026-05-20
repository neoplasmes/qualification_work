import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { scalePoint, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { Line } from '@visx/shape';
import { ParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';

import type { ChartDataPoint } from '../lib/parseChartData';
import { formatChartCell } from '../lib/formatChartCell';

const C = {
    primary: '#872557',
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surface: '#1a1a1a',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const CHART_HEIGHT = 260;

type LineChartInnerProps = {
    data: ChartDataPoint[];
    width: number;
    height: number;
};

const LineChartInner = ({ data, width, height }: LineChartInnerProps) => {
    const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
        useTooltip<ChartDataPoint>();

    const margin = { top: 16, right: 16, bottom: 48, left: 52 };
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const xScale = scalePoint<string>({
        range: [0, xMax],
        domain: data.map(d => d.label),
        padding: 0.1,
    });

    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value), 1);

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
                        numTicks={data.length}
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 11,
                            textAnchor: 'middle' as const,
                            dy: '0.33em',
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
                    <LinePath<ChartDataPoint>
                        data={data}
                        x={d => xScale(d.label) ?? 0}
                        y={d => yScale(d.value)}
                        stroke={C.primary}
                        strokeWidth={2}
                        curve={curveMonotoneX}
                    />
                    {data.map(d => (
                        <circle
                            key={d.label}
                            cx={xScale(d.label) ?? 0}
                            cy={yScale(d.value)}
                            r={4}
                            fill={C.primary}
                            stroke={C.surfaceHigh}
                            strokeWidth={1.5}
                            style={{ cursor: 'crosshair' }}
                            onMouseMove={event => {
                                const point = localPoint(event);
                                showTooltip({
                                    tooltipData: d,
                                    tooltipLeft: point?.x,
                                    tooltipTop: point?.y,
                                });
                            }}
                            onMouseLeave={hideTooltip}
                        />
                    ))}
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
                    <strong>{tooltipData.label}</strong>: {formatChartCell(tooltipData.value)}
                </TooltipWithBounds>
            )}
        </div>
    );
};

type LineChartProps = {
    data: ChartDataPoint[];
};

export const LineChart = ({ data }: LineChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width > 0 ? (
                <LineChartInner data={data} width={width} height={CHART_HEIGHT} />
            ) : null
        }
    </ParentSize>
);
