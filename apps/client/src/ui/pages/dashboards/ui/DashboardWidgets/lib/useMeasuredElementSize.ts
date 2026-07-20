import { useLayoutEffect, useRef, useState } from 'react';

type MeasuredElementSize = {
    width: number;
    height: number;
};

const emptySize: MeasuredElementSize = { width: 0, height: 0 };

export const useMeasuredElementSize = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<MeasuredElementSize>(emptySize);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const resizeObserver = new ResizeObserver(([entry]) => {
            const nextSize = {
                width: Math.floor(entry.contentRect.width),
                height: Math.floor(entry.contentRect.height),
            };

            setSize(current =>
                current.width === nextSize.width && current.height === nextSize.height
                    ? current
                    : nextSize
            );
        });

        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, []);

    return { ref, size };
};
