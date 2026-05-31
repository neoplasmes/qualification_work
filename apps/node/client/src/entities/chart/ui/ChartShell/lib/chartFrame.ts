import type { CSSProperties } from 'react';

export type ChartFrameHeight = number | 'fill';

export const defaultChartFrameHeight = 360;

export const getChartFrameStyle = (
    height: ChartFrameHeight = defaultChartFrameHeight
): CSSProperties => ({
    width: '100%',
    height: height === 'fill' ? '100%' : height,
    minHeight: 0,
});

export const getResolvedChartFrameHeight = (
    height: ChartFrameHeight | undefined,
    measuredHeight: number
) => {
    if (height === 'fill') {
        return Math.max(0, Math.floor(measuredHeight));
    }

    return height ?? defaultChartFrameHeight;
};
