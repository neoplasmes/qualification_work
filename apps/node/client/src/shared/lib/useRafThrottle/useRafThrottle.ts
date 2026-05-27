// oxlint-disable typescript/no-explicit-any
import { useCallback, useEffect, useRef } from 'react';

/**
 * calls the fn with the last parameters before paint stage
 *
 * @template {(...args: any[]) => void} T
 * @param {T} callback
 * @returns {T}
 */
export const useRafThrottle = <T extends (...args: any[]) => void>(callback: T): T => {
    const frame = useRef<number | null>(null);
    const callbackRef = useRef(callback);
    const lastArgs = useRef<any[]>([]);

    callbackRef.current = callback;

    useEffect(
        () => () => {
            if (frame.current !== null) {
                cancelAnimationFrame(frame.current);
                frame.current = null;
            }
        },
        []
    );

    return useCallback((...args: any[]) => {
        lastArgs.current = args;

        if (frame.current === null) {
            frame.current = requestAnimationFrame(() => {
                frame.current = null;
                callbackRef.current(...lastArgs.current);
            });
        }
    }, []) as T;
};
