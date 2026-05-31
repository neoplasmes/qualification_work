import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear, scalePoint } from '@visx/scale';
import { defaultStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { useMemo } from 'react';

import { DEFAULT_CHART_COLOR, mixChartColors } from '../../../../lib';
import { formatChartCell } from '../../../../lib/formatChartCell';

import { HEATMAP_COLORS, HEATMAP_GAP, type HeatmapMargin } from './heatmapChartConfig';
import type { HeatmapCell } from './heatmapChartTypes';

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
    color?: string;
    margin: HeatmapMargin;
    showAxisTickLabels: boolean;
};

export const HeatmapChartInner = ({
    data,
    xValues,
    yValues,
    cellMap,
    width,
    height,
    cellSize,
    color = DEFAULT_CHART_COLOR,
    margin,
    showAxisTickLabels,
}: HeatmapChartInnerProps) => {
    const {
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
    } = useTooltip<HeatmapCell>();

    const step = cellSize + HEATMAP_GAP;
    const gridWidth = xValues.length * step;
    const effectiveLeft = Math.max(margin.left, Math.floor((width - gridWidth) / 2));
    const gridHeight = yValues.length * step;

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
            mixChartColors(color, HEATMAP_COLORS.cellLow, 0.72),
            mixChartColors(color, HEATMAP_COLORS.cellHigh, 0.16),
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
                            showAxisTickLabels
                                ? formatChartCell(value, {
                                      timeGranularity: data[0]?.yTimeGranularity,
                                  })
                                : ''
                        }
                        tickLabelProps={() => ({
                            fill: HEATMAP_COLORS.muted,
                            fontSize: 14,
                            textAnchor: 'end' as const,
                            dx: '-0.25em',
                            dy: '0.33em',
                        })}
                        tickStroke={HEATMAP_COLORS.outline}
                        stroke={HEATMAP_COLORS.outline}
                    />
                    <AxisBottom
                        top={gridHeight}
                        scale={xAxisScale}
                        tickFormat={value =>
                            showAxisTickLabels
                                ? formatChartCell(value, {
                                      timeGranularity: data[0]?.xTimeGranularity,
                                  })
                                : ''
                        }
                        tickLabelProps={() => ({
                            fill: HEATMAP_COLORS.muted,
                            fontSize: 14,
                            textAnchor: 'end' as const,
                            angle: -45,
                            dx: '-0.25em',
                            dy: '0.25em',
                        })}
                        tickStroke={HEATMAP_COLORS.outline}
                        stroke={HEATMAP_COLORS.outline}
                    />
                    <HeatmapRect
                        data={columnData}
                        xScale={i => i * step}
                        yScale={i => i * step}
                        binWidth={cellSize}
                        binHeight={cellSize}
                        gap={HEATMAP_GAP}
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
                                        fill={cell.color ?? HEATMAP_COLORS.cellLow}
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
                        background: HEATMAP_COLORS.surfaceHigh,
                        color: HEATMAP_COLORS.onSurface,
                        border: `1px solid ${HEATMAP_COLORS.outline}`,
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
