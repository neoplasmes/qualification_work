import { useParentSize } from '@visx/responsive';
import { useMemo } from 'react';

import { compareCategoryLabels } from '@/shared/lib/dayOfWeek';

import type { ChartResultColumn } from '../api';
import { DEFAULT_CHART_COLOR } from '../lib';
import {
    HEATMAP_DEFAULT_CELL_SIZE,
    HEATMAP_GAP,
    HEATMAP_MARGIN,
    HEATMAP_MAX_CELL_SIZE,
    HEATMAP_MIN_WIDTH,
} from './HeatmapChart.config';
import type { HeatmapCell } from './HeatmapChart.types';
import { HeatmapChartInner } from './HeatmapChartInner';

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

const getHeatmapHeight = (rowsCount: number, cellSize: number) =>
    HEATMAP_MARGIN.top + HEATMAP_MARGIN.bottom + rowsCount * (cellSize + HEATMAP_GAP);

const getHeatmapCellSize = (width: number, columnsCount: number) => {
    if (columnsCount === 0) {
        return HEATMAP_DEFAULT_CELL_SIZE;
    }

    const xMax = width - HEATMAP_MARGIN.left - HEATMAP_MARGIN.right;

    return Math.max(
        6,
        Math.min(HEATMAP_MAX_CELL_SIZE, Math.floor(xMax / columnsCount) - HEATMAP_GAP)
    );
};

export const HeatmapChart = ({
    data,
    color = DEFAULT_CHART_COLOR,
}: HeatmapChartProps) => {
    const { parentRef, width } = useParentSize({
        ignoreDimensions: 'height',
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
    const baseHeight = getHeatmapHeight(yValues.length, HEATMAP_DEFAULT_CELL_SIZE);

    let content = null;

    if (width > 0 && width < HEATMAP_MIN_WIDTH) {
        content = <div style={{ height: baseHeight }} />;
    }

    if (width >= HEATMAP_MIN_WIDTH) {
        const cellSize = getHeatmapCellSize(width, xValues.length);
        const height = getHeatmapHeight(yValues.length, cellSize);

        content = (
            <HeatmapChartInner
                data={data}
                xValues={xValues}
                yValues={yValues}
                cellMap={cellMap}
                width={width}
                height={height}
                cellSize={cellSize}
                color={color}
            />
        );
    }

    return (
        <div ref={parentRef} style={{ width: '100%', minHeight: baseHeight }}>
            {content}
        </div>
    );
};
