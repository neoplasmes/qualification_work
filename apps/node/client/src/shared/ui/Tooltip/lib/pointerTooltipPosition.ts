export type PointerTooltipPlacement = 'left' | 'right';

type PointerTooltipPositionOptions = {
    clientX: number;
    clientY: number;
    viewportWidth: number;
    gap: number;
    margin: number;
    maxWidth: number;
};

type PointerTooltipPosition = {
    x: number;
    y: number;
    gap: number;
    placement: PointerTooltipPlacement;
};

export const getPointerTooltipPosition = ({
    clientX,
    clientY,
    viewportWidth,
    gap,
    margin,
    maxWidth,
}: PointerTooltipPositionOptions): PointerTooltipPosition => {
    const renderedMaxWidth = Math.max(0, Math.min(maxWidth, viewportWidth - margin * 2));
    const rightEdge = clientX + gap + renderedMaxWidth;
    const placement = rightEdge > viewportWidth - margin ? 'left' : 'right';
    const x =
        placement === 'left'
            ? Math.max(clientX, margin + renderedMaxWidth + gap)
            : Math.max(margin, clientX);

    return {
        x,
        y: Math.max(margin, clientY + gap),
        gap,
        placement,
    };
};

export const applyPointerTooltipPosition = (
    element: HTMLDivElement | null,
    position: PointerTooltipPosition
) => {
    if (!element) {
        return;
    }

    element.dataset.placement = position.placement;
    element.style.setProperty('--tooltip-x', `${position.x}px`);
    element.style.setProperty('--tooltip-y', `${position.y}px`);
    element.style.setProperty('--tooltip-gap', `${position.gap}px`);
};
