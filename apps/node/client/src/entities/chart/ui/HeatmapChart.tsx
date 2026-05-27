import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { HeatmapRect } from '@visx/heatmap';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scalePoint } from '@visx/scale';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { useMemo } from 'react';

import { compareCategoryLabels } from '@/shared/lib/dayOfWeek';

import type { ChartResultColumn } from '../api';
import { DEFAULT_CHART_COLOR, mixChartColors } from '../lib';
import { formatChartCell } from '../lib/formatChartCell';
import type { HeatmapCell } from './HeatmapChart.types';

const C = {
    cellLow: '#162030',
    cellHigh: '#4ecdc4',
    muted: '#b0b0b0',
    outline: '#2c2a2b',
    surfaceHigh: '#242424',
    onSurface: '#fff',
} as const;

const GAP = 4;
const MIN_CHART_WIDTH = 220;
const margin = { top: 16, right: 16, bottom: 132, left: 148 };
const DEFAULT_CELL_SIZE = 48;
const DEFAULT_STEP = DEFAULT_CELL_SIZE + GAP;

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
    color: string;
};

const HeatmapChartInner = ({
    data,
    xValues,
    yValues,
    cellMap,
    width,
    height,
    cellSize,
    color,
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
    const effectiveLeft = Math.max(margin.left, Math.floor((width - gridWidth) / 2));

    const columnData: ColumnDatum[] = useMemo(
        () =>
            xValues.map(x => ({
                x,
                bins: yValues.map(y => ({ y, count: cellMap.get(`${x}:${y}`) ?? 0 })),
            })),
        [xValues, yValues, cellMap]
    );

    const values = useMemo(() => data.map(c => c.value).filter(Number.isFinite), [data]);
    const sourceByCell = useMemo(
        () => new Map(data.map(item => [`${item.x}:${item.y}`, item])),
        [data]
    );
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values, 1) : 1;

    const colorScale = scaleLinear<string>({
        range: [
            mixChartColors(color, C.cellLow, 0.72),
            mixChartColors(color, C.cellHigh, 0.16),
        ],
        domain: [minValue, maxValue],
    });

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
                        tickFormat={value =>
                            formatChartCell(value, {
                                timeGranularity: data[0]?.yTimeGranularity,
                            })
                        }
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 14,
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
                        tickFormat={value =>
                            formatChartCell(value, {
                                timeGranularity: data[0]?.xTimeGranularity,
                            })
                        }
                        tickLabelProps={() => ({
                            fill: C.muted,
                            fontSize: 14,
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
                        xScale={i => i * step}
                        yScale={i => i * step}
                        binWidth={cellSize}
                        binHeight={cellSize}
                        gap={GAP}
                        colorScale={colorScale}
                        bins={col => col.bins}
                        count={bin => bin.count}
                    >
                        {cells =>
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
                                            const source = sourceByCell.get(
                                                `${cell.datum.x}:${cell.bin.y}`
                                            );
                                            showTooltip({
                                                tooltipData: {
                                                    x: cell.datum.x,
                                                    y: cell.bin.y,
                                                    value: cell.count ?? 0,
                                                    xTimeGranularity:
                                                        source?.xTimeGranularity,
                                                    yTimeGranularity:
                                                        source?.yTimeGranularity,
                                                    valueFormat: source?.valueFormat,
                                                },
                                                tooltipLeft: point?.x,
                                                tooltipTop: point?.y,
                                            });
                                        }}
                                        onMouseLeave={hideTooltip}
                                    />
                                ))
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
                    <strong>
                        {formatChartCell(tooltipData.x, {
                            timeGranularity: tooltipData.xTimeGranularity,
                        })}
                    </strong>{' '}
                    /{' '}
                    {formatChartCell(tooltipData.y, {
                        timeGranularity: tooltipData.yTimeGranularity,
                    })}
                    :{' '}
                    {formatChartCell(tooltipData.value, {
                        valueFormat: tooltipData.valueFormat,
                    })}
                </TooltipWithBounds>
            )}
        </div>
    );
};

type HeatmapChartProps = {
    data: HeatmapCell[];
    color?: string;
};

const uniqueValues = (values: string[]) => [...new Set(values)];

const sortHeatmapLabels = (
    values: string[],
    type: ChartResultColumn['type'] | undefined
) => {
    if (type !== 'string' && type !== 'day_of_week') {
        return values;
    }

    return [...values].sort(compareCategoryLabels);
};

export const HeatmapChart = ({
    data,
    color = DEFAULT_CHART_COLOR,
}: HeatmapChartProps) => {
    const xType = data[0]?.xType;
    const yType = data[0]?.yType;
    const xValues = useMemo(
        () => sortHeatmapLabels(uniqueValues(data.map(c => c.x)), xType),
        [data, xType]
    );
    const yValues = useMemo(
        () => sortHeatmapLabels(uniqueValues(data.map(c => c.y)), yType),
        [data, yType]
    );
    const cellMap = useMemo(
        () => new Map(data.map(c => [`${c.x}:${c.y}`, c.value])),
        [data]
    );
    const height = margin.top + margin.bottom + yValues.length * DEFAULT_STEP;

    return (
        <ParentSize style={{ height }}>
            {({ width }) => {
                if (width < MIN_CHART_WIDTH) {
                    return width > 0 ? <div style={{ height }} /> : null;
                }
                const xMax = width - margin.left - margin.right;
                const cellSize =
                    xValues.length > 0
                        ? Math.max(
                              6,
                              Math.min(72, Math.floor(xMax / xValues.length) - GAP)
                          )
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
                        color={color}
                    />
                );
            }}
        </ParentSize>
    );
};
