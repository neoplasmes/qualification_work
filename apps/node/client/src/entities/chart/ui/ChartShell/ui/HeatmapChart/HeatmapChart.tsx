import { useMemo } from 'react';

import { compareCategoryLabels } from '@/shared/lib/dayOfWeek';

import type { ChartResultColumn } from '../../../../api';
import { DEFAULT_CHART_COLOR } from '../../../../lib';

import {
    getChartAspectFrameStyle,
    getChartFrameStyle,
    getConstrainedChartFrameSize,
    getResolvedChartFrameHeight,
    useRafChartSize,
    type ChartAspectRatioConstraint,
    type ChartFrameHeight,
} from '../../lib';
import { HeatmapChartInner } from './HeatmapChartInner';
import { getHeatmapBaseHeight, getHeatmapLayout } from './heatmapChartLayout';
import type { HeatmapCell } from './heatmapChartTypes';

type HeatmapChartProps = {
    data: HeatmapCell[];
    color?: string;
    height?: ChartFrameHeight;
    aspectRatioConstraint?: ChartAspectRatioConstraint;
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

export const HeatmapChart = ({
    data,
    color = DEFAULT_CHART_COLOR,
    height,
    aspectRatioConstraint,
    showAxisTickLabels = true,
}: HeatmapChartProps) => {
    const fillHeight = height === 'fill';
    const {
        ref,
        width,
        height: measuredHeight,
    } = useRafChartSize({
        ignoreHeight: !fillHeight,
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
    const baseHeight = getHeatmapBaseHeight(yValues.length, showAxisTickLabels);
    const availableHeight =
        height === undefined
            ? undefined
            : getResolvedChartFrameHeight(height, measuredHeight);
    const rootStyle =
        height === undefined
            ? { width: '100%', minHeight: baseHeight }
            : { ...getChartFrameStyle(height), overflow: 'hidden' };

    let content = null;

    if (width > 0 && (!fillHeight || availableHeight)) {
        const chartHeight =
            availableHeight ?? getHeatmapBaseHeight(yValues.length, showAxisTickLabels);
        const frame = getConstrainedChartFrameSize(
            width,
            chartHeight,
            aspectRatioConstraint
        );
        const layout = getHeatmapLayout({
            width: frame.width,
            height: frame.height,
            xValues,
            yValues,
            showAxisTickLabels,
        });
        const innerContent = (
            <HeatmapChartInner
                data={data}
                xValues={xValues}
                yValues={yValues}
                cellMap={cellMap}
                width={frame.width}
                height={frame.height}
                cellSize={layout.cellSize}
                gap={layout.gap}
                color={color}
                margin={layout.margin}
                axisFontSize={layout.axisFontSize}
                xAxisLabelMaxChars={layout.xAxisLabelMaxChars}
                yAxisLabelMaxChars={layout.yAxisLabelMaxChars}
                showAxisTickLabels={layout.showAxisTickLabels}
            />
        );
        content = aspectRatioConstraint ? (
            <div style={getChartAspectFrameStyle(chartHeight)}>{innerContent}</div>
        ) : (
            innerContent
        );
    }

    return (
        <div ref={ref} style={rootStyle}>
            {content}
        </div>
    );
};
