import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleOrdinal } from '@visx/scale';
import { Pie } from '@visx/shape';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';

import { buildChartPalette, DEFAULT_CHART_COLOR } from '../../../../lib';
import { formatChartCell } from '../../../../lib/formatChartCell';
import type { ChartDataPoint } from '../../../../lib/parseChartData';

import {
    getChartFrameStyle,
    getResolvedChartFrameHeight,
    type ChartFrameHeight,
} from '../../lib';

const C = {
    outline: '#2c2a2b',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const PIE_COLORS = [
    DEFAULT_CHART_COLOR,
    '#b03070',
    '#c85080',
    '#5a1a3a',
    '#d4709a',
    '#3e1228',
    '#e090b8',
    '#6e1f47',
];

const MIN_CHART_WIDTH = 180;

// big slice gets a label in the slice itself; small slice gets a leader line outside
const INLINE_PCT_THRESHOLD = 7;
// outer label geometry (relative to outerRadius)
const OUTER_LINE_GAP = 6;
const OUTER_BEND_GAP = 22;
const OUTER_H_LEN = 14;
const OUTER_TEXT_PAD = 4;
// room reserved around the pie when at least one outer label will be drawn
const OUTER_RESERVE_W = 140;
const OUTER_RESERVE_H = 36;
// minimum padding when only inline labels are rendered
const INLINE_RESERVE = 16;

type PieChartInnerProps = {
    data: ChartDataPoint[];
    color?: string;
    width: number;
    height: number;
};

const PieChartInner = ({
    data,
    color = DEFAULT_CHART_COLOR,
    width,
    height,
}: PieChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<ChartDataPoint & { pct: string }>();

    const total = data.reduce((sum, d) => sum + d.value, 0);
    // only pay the radius penalty when at least one slice will need an outer label
    const hasSmallSlices = data.some(
        d => total > 0 && (d.value / total) * 100 < INLINE_PCT_THRESHOLD
    );
    const reserveW = hasSmallSlices ? OUTER_RESERVE_W : INLINE_RESERVE;
    const reserveH = hasSmallSlices ? OUTER_RESERVE_H : INLINE_RESERVE;
    const outerRadius = Math.max(
        50,
        Math.min(width / 2 - reserveW, height / 2 - reserveH)
    );
    const innerRadius = outerRadius * 0.5;
    const cx = width / 2;
    const cy = height / 2;

    const colorScale = scaleOrdinal<string, string>({
        domain: data.map(d => d.label),
        range: buildChartPalette(color, Math.max(data.length, PIE_COLORS.length)),
    });

    return (
        <div style={{ position: 'relative' }}>
            <svg
                width={width}
                height={height}
                role="img"
                aria-label="Pie chart"
                data-testid="pie-chart-svg"
            >
                <Group top={cy} left={cx}>
                    <Pie
                        data={data}
                        pieValue={d => d.value}
                        outerRadius={outerRadius}
                        innerRadius={innerRadius}
                        padAngle={0.02}
                    >
                        {({ arcs, path }) =>
                            arcs.map(arc => {
                                const pct =
                                    total > 0 ? (arc.data.value / total) * 100 : 0;
                                const pctText = pct.toFixed(pct < 1 ? 1 : 0);
                                const midAngle = (arc.startAngle + arc.endAngle) / 2;
                                const isInline = pct >= INLINE_PCT_THRESHOLD;
                                const fill = colorScale(arc.data.label);

                                // shared interaction handlers so both inline and outer
                                // labels keep the hover behaviour of the slice itself
                                const handleMove = (
                                    event: React.MouseEvent<SVGElement>
                                ) => {
                                    const point = localPoint(event);
                                    showTooltip({
                                        tooltipData: { ...arc.data, pct: pctText },
                                        tooltipLeft: point?.x,
                                        tooltipTop: point?.y,
                                    });
                                };

                                return (
                                    <g key={arc.data.label}>
                                        <path
                                            d={path(arc) ?? ''}
                                            fill={fill}
                                            onMouseMove={handleMove}
                                            onMouseLeave={hideTooltip}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        {isInline
                                            ? renderInlineLabel(
                                                  path.centroid(arc),
                                                  arc.data.label,
                                                  pctText
                                              )
                                            : renderOuterLabel(
                                                  midAngle,
                                                  outerRadius,
                                                  arc.data.label,
                                                  pctText
                                              )}
                                    </g>
                                );
                            })
                        }
                    </Pie>
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
                    <strong>
                        {formatChartCell(tooltipData.label, {
                            timeGranularity: tooltipData.labelTimeGranularity,
                        })}
                    </strong>
                    :{' '}
                    {formatChartCell(tooltipData.value, {
                        valueFormat: tooltipData.valueFormat,
                    })}{' '}
                    ({tooltipData.pct}%)
                </TooltipWithBounds>
            )}
        </div>
    );
};

const renderInlineLabel = (
    centroid: [number, number],
    label: string,
    pctText: string
) => {
    const [lx, ly] = centroid;

    return (
        <text
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={C.onSurface}
            fontSize={11}
            fontWeight={600}
            pointerEvents="none"
            // outline gives readability on lighter slice colors
            style={{
                paintOrder: 'stroke',
                stroke: 'rgba(0, 0, 0, 0.55)',
                strokeWidth: 3,
                strokeLinejoin: 'round',
            }}
        >
            {label} {pctText}%
        </text>
    );
};

const renderOuterLabel = (
    midAngle: number,
    outerRadius: number,
    label: string,
    pctText: string
) => {
    // arc midpoint just outside the slice -> bend point -> horizontal tip
    const sin = Math.sin(midAngle);
    const cos = -Math.cos(midAngle);
    const sx = sin * (outerRadius + OUTER_LINE_GAP);
    const sy = cos * (outerRadius + OUTER_LINE_GAP);
    const bx = sin * (outerRadius + OUTER_BEND_GAP);
    const by = cos * (outerRadius + OUTER_BEND_GAP);
    const onRight = midAngle < Math.PI;
    const tipX = bx + (onRight ? OUTER_H_LEN : -OUTER_H_LEN);
    const tipY = by;
    const textX = tipX + (onRight ? OUTER_TEXT_PAD : -OUTER_TEXT_PAD);

    return (
        <>
            <polyline
                points={`${sx},${sy} ${bx},${by} ${tipX},${tipY}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1}
                pointerEvents="none"
            />
            <text
                x={textX}
                y={tipY}
                textAnchor={onRight ? 'start' : 'end'}
                dominantBaseline="middle"
                fill="rgba(255, 255, 255, 0.85)"
                fontSize={11}
                pointerEvents="none"
            >
                {label} {pctText}%
            </text>
        </>
    );
};

type PieChartProps = {
    data: ChartDataPoint[];
    color?: string;
    height?: ChartFrameHeight;
};

export const PieChart = ({
    data,
    color = DEFAULT_CHART_COLOR,
    height,
}: PieChartProps) => (
    <ParentSize style={getChartFrameStyle(height)}>
        {({ width, height: measuredHeight }) => {
            const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);

            return width >= MIN_CHART_WIDTH && chartHeight > 0 ? (
                <PieChartInner
                    data={data}
                    color={color}
                    width={width}
                    height={chartHeight}
                />
            ) : width > 0 ? (
                <div style={{ height: chartHeight }} />
            ) : null;
        }}
    </ParentSize>
);
