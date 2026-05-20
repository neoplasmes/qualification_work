import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
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

type BarChartInnerProps = {
    data: ChartDataPoint[];
    width: number;
    height: number;
};

const BarChartInner = ({ data, width, height }: BarChartInnerProps) => {
    const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
        useTooltip<ChartDataPoint>();

    const rotateLabels = data.length > 6;
    const margin = {
        top: 16,
        right: 16,
        bottom: rotateLabels ? 64 : 48,
        left: 52,
    };

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const xScale = scaleBand<string>({
        range: [0, xMax],
        domain: data.map(d => d.label),
        padding: 0.3,
    });

    const yScale = scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, Math.max(...data.map(d => d.value), 1)],
        nice: true,
    });

    const tickLabelProps = () =>
        ({
            fill: C.muted,
            fontSize: 11,
            textAnchor: rotateLabels ? ('end' as const) : ('middle' as const),
            transform: rotateLabels ? 'rotate(-30)' : undefined,
            dx: rotateLabels ? '-0.33em' : '0',
            dy: rotateLabels ? '-0.1em' : '0.33em',
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
                        numTicks={data.length}
                        tickLabelProps={tickLabelProps}
                        tickStroke={C.outline}
                        stroke={C.outline}
                    />
                    {data.map(d => {
                        const barX = xScale(d.label) ?? 0;
                        const barY = yScale(d.value);
                        const barWidth = xScale.bandwidth();
                        const barHeight = yMax - barY;

                        return (
                            <Bar
                                key={d.label}
                                x={barX}
                                y={barY}
                                width={barWidth}
                                height={Math.max(0, barHeight)}
                                fill={C.primary}
                                rx={2}
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
                    <strong>{tooltipData.label}</strong>: {formatChartCell(tooltipData.value)}
                </TooltipWithBounds>
            )}
        </div>
    );
};

type BarChartProps = {
    data: ChartDataPoint[];
};

export const BarChart = ({ data }: BarChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width > 0 ? (
                <BarChartInner data={data} width={width} height={CHART_HEIGHT} />
            ) : null
        }
    </ParentSize>
);
