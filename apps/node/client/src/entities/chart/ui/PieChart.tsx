import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleOrdinal } from '@visx/scale';
import { Pie } from '@visx/shape';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';

import { formatChartCell } from '../lib/formatChartCell';
import type { ChartDataPoint } from '../lib/parseChartData';

const C = {
    outline: '#2c2a2b',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const PIE_COLORS = [
    '#872557',
    '#b03070',
    '#c85080',
    '#5a1a3a',
    '#d4709a',
    '#3e1228',
    '#e090b8',
    '#6e1f47',
];

const CHART_HEIGHT = 360;
const MIN_CHART_WIDTH = 180;

type PieChartInnerProps = {
    data: ChartDataPoint[];
    width: number;
    height: number;
};

const PieChartInner = ({ data, width, height }: PieChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<ChartDataPoint & { pct: string }>();

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const outerRadius = Math.min(width, height) / 2 - 16;
    const innerRadius = outerRadius * 0.5;
    const cx = width / 2;
    const cy = height / 2;

    const colorScale = scaleOrdinal<string, string>({
        domain: data.map(d => d.label),
        range: PIE_COLORS,
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
                            arcs.map(arc => (
                                <path
                                    key={arc.data.label}
                                    d={path(arc) ?? ''}
                                    fill={colorScale(arc.data.label)}
                                    onMouseMove={event => {
                                        const point = localPoint(event);
                                        const pct =
                                            total > 0
                                                ? (
                                                      (arc.data.value / total) *
                                                      100
                                                  ).toFixed(1)
                                                : '0.0';
                                        showTooltip({
                                            tooltipData: { ...arc.data, pct },
                                            tooltipLeft: point?.x,
                                            tooltipTop: point?.y,
                                        });
                                    }}
                                    onMouseLeave={hideTooltip}
                                    style={{ cursor: 'pointer' }}
                                />
                            ))
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

type PieChartProps = {
    data: ChartDataPoint[];
};

export const PieChart = ({ data }: PieChartProps) => (
    <ParentSize style={{ height: CHART_HEIGHT }}>
        {({ width }) =>
            width >= MIN_CHART_WIDTH ? (
                <PieChartInner data={data} width={width} height={CHART_HEIGHT} />
            ) : width > 0 ? (
                <div style={{ height: CHART_HEIGHT }} />
            ) : null
        }
    </ParentSize>
);
