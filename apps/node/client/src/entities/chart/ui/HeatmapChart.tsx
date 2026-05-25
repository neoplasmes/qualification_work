import { useMemo } from 'react';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { HeatmapRect } from '@visx/heatmap';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scalePoint } from '@visx/scale';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';

import { formatChartCell } from '../lib/formatChartCell';

const C = {
    cellLow: '#162030',
    cellHigh: '#4ecdc4',
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const GAP = 2;
const MIN_CHART_WIDTH = 220;
const margin = { top: 16, right: 16, bottom: 80, left: 100 };
// default cell size when not yet computed
const DEFAULT_CELL_SIZE = 28;
const DEFAULT_STEP = DEFAULT_CELL_SIZE + GAP;

export type HeatmapCell = {
    x: string;
    y: string;
    value: number;
};

type ColumnDatum = { x: string; bins: BinDatum[] };
type BinDatum = { y: string; count: number };

type HeatmapChartInnerProps = {
    data: HeatmapCell[];
    xValues: string[];
    yValues: string[];
    cellMap: Map<string, number>;
    width: number;
    height: number;
    cellSize: number;
};

const HeatmapChartInner = ({
    data,
    xValues,
    yValues,
    cellMap,
    width,
    height,
    cellSize,
}: HeatmapChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<HeatmapCell>();

    const step = cellSize + GAP;
    const gridWidth = xValues.length * step;
    const available = width - margin.left - margin.right;
    const effectiveLeft = margin.left + Math.max(0, Math.floor((available - gridWidth) / 2));

    const columnData: ColumnDatum[] = useMemo(
        () => xValues.map(x => ({
            x,
            bins: yValues.map(y => ({ y, count: cellMap.get(`${x}:${y}`) ?? 0 })),
        })),
        [xValues, yValues, cellMap],
    );

    const values = useMemo(
        () => data.map(c => c.value).filter(Number.isFinite),
        [data],
    );
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;

    const colorScale = scaleLinear<string>({
        range: [C.cellLow, C.cellHigh],
        domain: [minValue, maxValue],
    });

    // tick positions centered on each cell
    const xAxisScale = scalePoint<string>({
        range: [cellSize / 2, xValues.length * step - step / 2],
        domain: xValues,
    });
    const yAxisScale = scalePoint<string>({
        range: [cellSize / 2, yValues.length * step - step / 2],
        domain: yValues,
    });

    const gridHeight = yValues.length * step;

    return (
        <div style={{ position: 'relative' }}>
            <svg
                width={width}
                height={height}
                role="img"
                aria-label="Heatmap chart"
                data-testid="heatmap-chart-svg"
            >
                <Group left={effectiveLeft} top={margin.top}>
                    <AxisLeft
                        scale={yAxisScale}
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
                        top={gridHeight}
                        scale={xAxisScale}
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 11,
                            textAnchor: 'end' as const,
                            angle: -45,
                            dx: '-0.25em',
                            dy: '0.25em',
                        })}
                        tickStroke={C.outline}
                        stroke={C.outline}
                    />
                    <HeatmapRect
                        data={columnData}
                        xScale={(i) => i * step}
                        yScale={(i) => i * step}
                        binWidth={cellSize}
                        binHeight={cellSize}
                        gap={GAP}
                        colorScale={colorScale}
                        bins={(col) => col.bins}
                        count={(bin) => bin.count}
                    >
                        {(cells) =>
                            cells.map(colCells =>
                                colCells.map(cell => (
                                    <rect
                                        key={`${cell.datum.x}:${cell.bin.y}`}
                                        x={cell.x}
                                        y={cell.y}
                                        width={cell.width}
                                        height={cell.height}
                                        rx={2}
                                        fill={cell.color ?? C.cellLow}
                                        onMouseMove={event => {
                                            const point = localPoint(event);
                                            showTooltip({
                                                tooltipData: {
                                                    x: cell.datum.x,
                                                    y: cell.bin.y,
                                                    value: cell.count ?? 0,
                                                },
                                                tooltipLeft: point?.x,
                                                tooltipTop: point?.y,
                                            });
                                        }}
                                        onMouseLeave={hideTooltip}
                                    />
                                )),
                            )
                        }
                    </HeatmapRect>
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

export const HeatmapChart = ({ data }: HeatmapChartProps) => {
    const xValues = useMemo(() => [...new Set(data.map(c => c.x))], [data]);
    const yValues = useMemo(() => [...new Set(data.map(c => c.y))], [data]);
    const cellMap = useMemo(
        () => new Map(data.map(c => [`${c.x}:${c.y}`, c.value])),
        [data],
    );
    const height = margin.top + margin.bottom + yValues.length * DEFAULT_STEP;

    return (
        <ParentSize style={{ height }}>
            {({ width }) => {
                if (width < MIN_CHART_WIDTH) {
                    return width > 0 ? <div style={{ height }} /> : null;
                }
                const xMax = width - margin.left - margin.right;
                const cellSize = xValues.length > 0
                    ? Math.max(6, Math.min(40, Math.floor(xMax / xValues.length) - GAP))
                    : DEFAULT_CELL_SIZE;
                const step = cellSize + GAP;
                const dynamicHeight = margin.top + margin.bottom + yValues.length * step;

                return (
                    <HeatmapChartInner
                        data={data}
                        xValues={xValues}
                        yValues={yValues}
                        cellMap={cellMap}
                        width={width}
                        height={dynamicHeight}
                        cellSize={cellSize}
                    />
                );
            }}
        </ParentSize>
    );
};
