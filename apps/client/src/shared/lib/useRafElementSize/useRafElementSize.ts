import { useLayoutEffect, useRef, useState } from 'react';

// oxlint-disable
import { useRafThrottle } from '@/shared/lib/useRafThrottle';

type ElementSize = {
    width: number;
    height: number;
};

type UseRafElementSizeOptions = {
    ignoreHeight?: boolean;
};

const emptySize: ElementSize = { width: 0, height: 0 };

export const useRafElementSize = <T extends HTMLElement = HTMLDivElement>({
    ignoreHeight = false,
}: UseRafElementSizeOptions = {}) => {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<ElementSize>(emptySize);
    const updateSize = useRafThrottle((nextSize: ElementSize) => {
        setSize(current =>
            current.width === nextSize.width && current.height === nextSize.height
                ? current
                : nextSize
        );
    });

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const resizeObserver = new ResizeObserver(([entry]) => {
            updateSize({
                width: Math.floor(entry.contentRect.width),
                height: ignoreHeight ? 0 : Math.floor(entry.contentRect.height),
            });
        });

        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, [ignoreHeight, updateSize]);

    return { ref, size };
};
