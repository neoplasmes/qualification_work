import type { CSSProperties } from 'react';

const tooltipOffset = 12;
const viewportPadding = 12;

type SvgPoint = {
    x: number;
    y: number;
};

export type ChartTooltipPoint = {
    x: number;
    y: number;
};

export const getChartTooltipPoint = (
    event: Event | undefined,
    svgPoint: SvgPoint | undefined
): ChartTooltipPoint => {
    const pointerEvent = event as
        | (Event & { clientX?: number; clientY?: number })
        | undefined;

    if (pointerEvent?.clientX !== undefined && pointerEvent.clientY !== undefined) {
        return { x: pointerEvent.clientX, y: pointerEvent.clientY };
    }

    return { x: svgPoint?.x ?? 0, y: svgPoint?.y ?? 0 };
};

type FixedChartTooltipStyleParams = ChartTooltipPoint & {
    maxWidth: number;
    zIndex: number;
};

export const getFixedChartTooltipStyle = ({
    x,
    y,
    maxWidth,
    zIndex,
}: FixedChartTooltipStyleParams): CSSProperties => {
    const viewportWidth =
        typeof window === 'undefined'
            ? maxWidth + viewportPadding * 2
            : window.innerWidth;
    const rightSideLeft = x + tooltipOffset;
    const shouldPlaceLeft = rightSideLeft + maxWidth > viewportWidth - viewportPadding;
    const left = shouldPlaceLeft
        ? Math.max(viewportPadding, x - tooltipOffset - maxWidth)
        : Math.min(rightSideLeft, viewportWidth - viewportPadding - maxWidth);

    return {
        position: 'fixed',
        zIndex,
        top: y,
        left,
        maxWidth,
        pointerEvents: 'none',
        transform: 'translateY(-50%)',
    };
};
