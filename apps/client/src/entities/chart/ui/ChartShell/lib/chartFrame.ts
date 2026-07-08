import type { CSSProperties } from 'react';

export type ChartFrameHeight = number | 'fill';
export type ChartAspectRatioConstraint = {
    min: number;
    max: number;
};

export const defaultChartFrameHeight = 360;
export const dashboardChartAspectRatioConstraint: ChartAspectRatioConstraint = {
    min: 1 / 1.25,
    max: 2,
};
export const dashboardLineChartAspectRatioConstraint: ChartAspectRatioConstraint = {
    ...dashboardChartAspectRatioConstraint,
    max: 2.5,
};

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

export const getConstrainedChartFrameSize = (
    width: number,
    height: number,
    constraint: ChartAspectRatioConstraint | undefined
) => {
    if (!constraint || width <= 0 || height <= 0) {
        return { width, height };
    }

    const ratio = width / height;
    if (ratio > constraint.max) {
        return {
            width: Math.floor(height * constraint.max),
            height,
        };
    }

    if (ratio < constraint.min) {
        return {
            width,
            height: Math.floor(width / constraint.min),
        };
    }

    return { width, height };
};

export const getChartAspectFrameStyle = (height: number): CSSProperties => ({
    display: 'flex',
    width: '100%',
    height,
    minWidth: 0,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
});
