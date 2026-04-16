// oxlint-disable typescript/no-explicit-any
import { useCallback, useRef } from 'react';

/**
 * calls the fn with the last parameters before paint stage
 *
 * @template {(...args: any[]) => void} T
 * @param {T} callback
 * @returns {T}
 */
export const useRafThrottle = <T extends (...args: any[]) => void>(callback: T): T => {
    const frame = useRef<number | null>(null);
    const lastArgs = useRef<any[]>([]);

    return useCallback(
        (...args: any[]) => {
            lastArgs.current = args;

            if (frame.current === null) {
                frame.current = requestAnimationFrame(() => {
                    frame.current = null;
                    callback(...lastArgs.current);
                });
            }
        },
        [callback]
    ) as T;
};
