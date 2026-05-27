import { useEffect, useRef, useState } from 'react';

export const useMeasuredSize = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const ro = new ResizeObserver(([entry]) =>
            setSize({
                w: Math.floor(entry.contentRect.width),
                h: Math.floor(entry.contentRect.height),
            })
        );
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    return { ref, size };
};
