import { useEffect, useRef, type RefObject } from 'react';

import { useRafThrottle } from '../useRafThrottle';

type UseHasOverflowOptions = {
    enabled?: boolean;
    paddingRight?: number;
};

export const useHasOverflow = <T extends HTMLElement>(
    ref: RefObject<T | null>,
    { enabled = true, paddingRight = 8 }: UseHasOverflowOptions = {}
) => {
    const stateRef = useRef<{ element: T; initialPaddingRight: string } | null>(null);

    const applyOverflowPadding = useRafThrottle(() => {
        const state = stateRef.current;
        if (!state) {
            return;
        }

        const { element, initialPaddingRight } = state;
        element.style.paddingRight =
            element.scrollHeight > element.clientHeight
                ? `${paddingRight}px`
                : initialPaddingRight;
    });

    useEffect(() => {
        const element = ref.current;
        if (!element || !enabled) {
            return undefined;
        }

        const initialPaddingRight = element.style.paddingRight;
        stateRef.current = { element, initialPaddingRight };

        const resizeObserver = new ResizeObserver(applyOverflowPadding);
        const observeTargets = () => {
            resizeObserver.disconnect();
            resizeObserver.observe(element);

            for (const child of element.children) {
                resizeObserver.observe(child);
            }
        };
        const mutationObserver = new MutationObserver(() => {
            observeTargets();
            applyOverflowPadding();
        });

        observeTargets();
        mutationObserver.observe(element, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
        });
        window.addEventListener('resize', applyOverflowPadding);
        applyOverflowPadding();

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener('resize', applyOverflowPadding);
            element.style.paddingRight = initialPaddingRight;
            stateRef.current = null;
        };
    }, [applyOverflowPadding, enabled, ref]);
};
