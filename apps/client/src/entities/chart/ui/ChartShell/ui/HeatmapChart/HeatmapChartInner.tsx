import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear, scalePoint } from '@visx/scale';
import { useMemo, useState } from 'react';

import { DEFAULT_CHART_COLOR, withChartLightness } from '../../../../lib';
import { formatChartCell } from '../../../../lib/formatChartCell';

import { getAdaptiveAxisTickLabels } from '../../lib';
import { HeatmapChartTooltip, type HoveredHeatmapCell } from '../HeatmapChartTooltip';
import { HEATMAP_COLORS, type HeatmapMargin } from './heatmapChartConfig';
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
    gap: number;
    color?: string;
    margin: HeatmapMargin;
    axisFontSize: number;
    xAxisLabelMaxChars: number;
    yAxisLabelMaxChars: number;
    showAxisTickLabels: boolean;
};

const truncateAxisLabel = (label: string, maxChars: number) => {
    if (maxChars <= 0 || label.length <= maxChars) {
        return label;
    }

    return `${label.slice(0, Math.max(1, maxChars - 3))}...`;
};

const formatHeatmapAxisLabel = (
    value: unknown,
    timeGranularity: HeatmapCell['xTimeGranularity'],
    maxChars: number
) => truncateAxisLabel(formatChartCell(value, { timeGranularity }), maxChars);

export const HeatmapChartInner = ({
    data,
    xValues,
    yValues,
    cellMap,
    width,
    height,
    cellSize,
    gap,
    color = DEFAULT_CHART_COLOR,
    margin,
    axisFontSize,
    xAxisLabelMaxChars,
    yAxisLabelMaxChars,
    showAxisTickLabels,
}: HeatmapChartInnerProps) => {
    const [hovered, setHovered] = useState<HoveredHeatmapCell>(null);

    const step = cellSize + gap;
    const gridWidth = xValues.length * cellSize + Math.max(0, xValues.length - 1) * gap;
    const gridHeight = yValues.length * cellSize + Math.max(0, yValues.length - 1) * gap;
    const plotWidth = Math.max(0, width - margin.left - margin.right);
    const plotHeight = Math.max(0, height - margin.top - margin.bottom);
    const effectiveLeft =
        margin.left + Math.max(0, Math.floor((plotWidth - gridWidth) / 2));
    const effectiveTop =
        margin.top + Math.max(0, Math.floor((plotHeight - gridHeight) / 2));
    const visibleGridWidth = Math.max(
        0,
        Math.min(gridWidth, width - effectiveLeft - margin.right)
    );
    const visibleGridHeight = Math.max(
        0,
        Math.min(gridHeight, height - effectiveTop - margin.bottom)
    );
    const cellRadius = Math.round(Math.min(10, Math.max(1, cellSize * 0.14)));
    const axisOffset = 6;

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
    const lowValueColor = withChartLightness(color, HEATMAP_COLORS.lowValueLightness);
    const highValueColor = withChartLightness(color, HEATMAP_COLORS.highValueLightness);

    const colorScale = scaleLinear<string>({
        range: [lowValueColor, highValueColor],
        domain: [minValue, maxValue],
    });

    const xAxisScale = scalePoint<string>({
        range: [cellSize / 2, Math.max(cellSize / 2, gridWidth - cellSize / 2)],
        domain: xValues,
    });
    const yAxisScale = scalePoint<string>({
        range: [cellSize / 2, Math.max(cellSize / 2, gridHeight - cellSize / 2)],
        domain: yValues,
    });
    const xAxisTickValues = showAxisTickLabels
        ? getAdaptiveAxisTickLabels({
              labels: xValues,
              availableSpace: visibleGridWidth,
              minSpacing: Math.max(42, axisFontSize * 3.6),
          })
        : [];
    const yAxisTickValues = showAxisTickLabels
        ? getAdaptiveAxisTickLabels({
              labels: yValues,
              availableSpace: visibleGridHeight,
              minSpacing: Math.max(24, axisFontSize * 2.2),
          })
        : [];

    let axes = null;

    if (showAxisTickLabels) {
        axes = (
            <>
                <AxisLeft
                    left={-axisOffset}
                    scale={yAxisScale}
                    tickValues={yAxisTickValues}
                    tickFormat={value =>
                        formatHeatmapAxisLabel(
                            value,
                            data[0]?.yTimeGranularity,
                            yAxisLabelMaxChars
                        )
                    }
                    tickLabelProps={() => ({
                        fill: HEATMAP_COLORS.muted,
                        fontSize: axisFontSize,
                        textAnchor: 'end' as const,
                        dx: '-0.25em',
                        dy: '0.33em',
                    })}
                    tickStroke={HEATMAP_COLORS.outline}
                    stroke={HEATMAP_COLORS.outline}
                />
                <AxisBottom
                    top={gridHeight + axisOffset}
                    scale={xAxisScale}
                    tickValues={xAxisTickValues}
                    tickFormat={value =>
                        formatHeatmapAxisLabel(
                            value,
                            data[0]?.xTimeGranularity,
                            xAxisLabelMaxChars
                        )
                    }
                    tickLabelProps={() => ({
                        fill: HEATMAP_COLORS.muted,
                        fontSize: axisFontSize,
                        textAnchor: 'end' as const,
                        angle: -45,
                        dx: '-0.25em',
                        dy: '0.25em',
                    })}
                    tickStroke={HEATMAP_COLORS.outline}
                    stroke={HEATMAP_COLORS.outline}
                />
            </>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <svg
                width={width}
                height={height}
                role="img"
                aria-label="Heatmap chart"
                data-testid="heatmap-chart-svg"
            >
                <Group left={effectiveLeft} top={effectiveTop}>
                    {axes}
                    <HeatmapRect
                        data={columnData}
                        xScale={i => i * step}
                        yScale={i => i * step - gap}
                        binWidth={cellSize + gap}
                        binHeight={cellSize + gap}
                        gap={gap}
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
                                        rx={cellRadius}
                                        fill={cell.color ?? lowValueColor}
                                        onMouseMove={event => {
                                            const source = sourceByCell.get(
                                                `${cell.datum.x}:${cell.bin.y}`
                                            );

                                            setHovered({
                                                cell: {
                                                    x: cell.datum.x,
                                                    y: cell.bin.y,
                                                    value: cell.count ?? 0,
                                                    xTimeGranularity:
                                                        source?.xTimeGranularity,
                                                    yTimeGranularity:
                                                        source?.yTimeGranularity,
                                                    valueFormat: source?.valueFormat,
                                                },
                                                point: {
                                                    x: event.clientX,
                                                    y: event.clientY,
                                                },
                                            });
                                        }}
                                        onMouseLeave={() => setHovered(null)}
                                    />
                                ))
                            )
                        }
                    </HeatmapRect>
                </Group>
            </svg>
            <HeatmapChartTooltip hovered={hovered} maxWidth={220} />
        </div>
    );
};
