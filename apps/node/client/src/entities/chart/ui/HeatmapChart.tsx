import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';

import { formatChartCell } from '../lib/formatChartCell';

const C = {
    low: '#2b2030',
    high: '#c85080',
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const CHART_HEIGHT = 300;
const MIN_CHART_WIDTH = 220;

export type HeatmapCell = {
    x: string;
    y: string;
    value: number;
};

type HeatmapChartInnerProps = {
    data: HeatmapCell[];
    width: number;
    height: number;
};

const HeatmapChartInner = ({ data, width, height }: HeatmapChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<HeatmapCell>();

    const margin = { top: 16, right: 16, bottom: 64, left: 96 };
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;
    const xValues = [...new Set(data.map(cell => cell.x))];
    const yValues = [...new Set(data.map(cell => cell.y))];

    const xScale = scaleBand<string>({
        range: [0, xMax],
        domain: xValues,
        padding: 0.08,
    });
    const yScale = scaleBand<string>({
        range: [0, yMax],
        domain: yValues,
        padding: 0.08,
    });
    const values = data.map(cell => cell.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 1);
    const colorScale = scaleLinear<string>({
        range: [C.low, C.high],
        domain: [minValue, maxValue],
    });

    return (
        <div style={{ position: 'relative' }}>
            <svg
                width={width}
                height={height}
                role="img"
                aria-label="Heatmap chart"
                data-testid="heatmap-chart-svg"
            >
                <Group left={margin.left} top={margin.top}>
                    <AxisLeft
                        scale={yScale}
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
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 11,
                            textAnchor: 'end' as const,
                            transform: 'rotate(-30)',
                            dx: '-0.33em',
                            dy: '-0.1em',
                        })}
                        tickStroke={C.outline}
                        stroke={C.outline}
                    />
                    {data.map(cell => (
                        <rect
                            key={`${cell.x}:${cell.y}`}
                            x={xScale(cell.x) ?? 0}
                            y={yScale(cell.y) ?? 0}
                            width={xScale.bandwidth()}
                            height={yScale.bandwidth()}
                            rx={2}
                            fill={colorScale(cell.value)}
                            onMouseMove={event => {
                                const point = localPoint(event);
                                showTooltip({
                                    tooltipData: cell,
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
                    <strong>{tooltipData.x}</strong> / {tooltipData.y}:{' '}
                    {formatChartCell(tooltipData.value)}
                </TooltipWithBounds>
            )}
        </div>
    );
};

type HeatmapChartProps = {
    data: HeatmapCell[];
};

export const HeatmapChart = ({ data }: HeatmapChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <HeatmapChartInner data={data} width={width} height={CHART_HEIGHT} />
            ) : width > 0 ? (
                <div style={{ height: CHART_HEIGHT }} />
            ) : null
        }
    </ParentSize>
);
