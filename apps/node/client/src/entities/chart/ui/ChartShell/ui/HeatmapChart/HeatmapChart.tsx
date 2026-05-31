import { useParentSize } from '@visx/responsive';
import { useMemo } from 'react';

import { compareCategoryLabels } from '@/shared/lib/dayOfWeek';

import type { ChartResultColumn } from '../../../../api';
import { DEFAULT_CHART_COLOR } from '../../../../lib';

import {
    getChartFrameStyle,
    getResolvedChartFrameHeight,
    type ChartFrameHeight,
} from '../../lib';
import {
    HEATMAP_COMPACT_MARGIN,
    HEATMAP_DEFAULT_CELL_SIZE,
    HEATMAP_GAP,
    HEATMAP_MARGIN,
    HEATMAP_MAX_CELL_SIZE,
    HEATMAP_MIN_WIDTH,
    type HeatmapMargin,
} from './heatmapChartConfig';
import { HeatmapChartInner } from './HeatmapChartInner';
import type { HeatmapCell } from './heatmapChartTypes';

type HeatmapChartProps = {
    data: HeatmapCell[];
    color?: string;
    height?: ChartFrameHeight;
    showAxisTickLabels?: boolean;
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

const getHeatmapHeight = (rowsCount: number, cellSize: number, margin: HeatmapMargin) =>
    margin.top + margin.bottom + rowsCount * (cellSize + HEATMAP_GAP);

const getHeatmapCellSize = (
    width: number,
    columnsCount: number,
    height: number | undefined,
    rowsCount: number,
    margin: HeatmapMargin
) => {
    if (columnsCount === 0) {
        return HEATMAP_DEFAULT_CELL_SIZE;
    }

    const xMax = width - margin.left - margin.right;
    const widthSize = Math.floor(xMax / columnsCount) - HEATMAP_GAP;
    const heightSize =
        height && rowsCount > 0
            ? Math.floor((height - margin.top - margin.bottom) / rowsCount) - HEATMAP_GAP
            : HEATMAP_MAX_CELL_SIZE;

    return Math.max(6, Math.min(HEATMAP_MAX_CELL_SIZE, widthSize, heightSize));
};

export const HeatmapChart = ({
    data,
    color = DEFAULT_CHART_COLOR,
    height,
    showAxisTickLabels = true,
}: HeatmapChartProps) => {
    const fillHeight = height === 'fill';
    const margin = showAxisTickLabels ? HEATMAP_MARGIN : HEATMAP_COMPACT_MARGIN;
    const {
        parentRef,
        width,
        height: measuredHeight,
    } = useParentSize({
        ignoreDimensions: fillHeight ? undefined : 'height',
    });
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
    const baseHeight = getHeatmapHeight(
        yValues.length,
        HEATMAP_DEFAULT_CELL_SIZE,
        margin
    );
    const availableHeight =
        height === undefined
            ? undefined
            : getResolvedChartFrameHeight(height, measuredHeight);
    const rootStyle =
        height === undefined
            ? { width: '100%', minHeight: baseHeight }
            : { ...getChartFrameStyle(height), overflow: 'hidden' };

    let content = null;

    if (width > 0 && width < HEATMAP_MIN_WIDTH) {
        content = <div style={{ height: availableHeight ?? baseHeight }} />;
    }

    if (width >= HEATMAP_MIN_WIDTH && (!fillHeight || availableHeight)) {
        const cellSize = getHeatmapCellSize(
            width,
            xValues.length,
            availableHeight,
            yValues.length,
            margin
        );
        const chartHeight =
            availableHeight ?? getHeatmapHeight(yValues.length, cellSize, margin);

        content = (
            <HeatmapChartInner
                data={data}
                xValues={xValues}
                yValues={yValues}
                cellMap={cellMap}
                width={width}
                height={chartHeight}
                cellSize={cellSize}
                color={color}
                margin={margin}
                showAxisTickLabels={showAxisTickLabels}
            />
        );
    }

    return (
        <div ref={parentRef} style={rootStyle}>
            {content}
        </div>
    );
};
