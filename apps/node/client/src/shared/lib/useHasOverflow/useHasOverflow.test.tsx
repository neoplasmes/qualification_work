import { act, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHasOverflow } from './useHasOverflow';

const OverflowProbe = () => {
    const ref = useRef<HTMLDivElement>(null);

    useHasOverflow(ref);

    return <div ref={ref} data-testid="overflow-probe" />;
};

const setElementSize = (
    element: HTMLElement,
    { clientHeight, scrollHeight }: { clientHeight: number; scrollHeight: number }
) => {
    Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: clientHeight,
    });
    Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: scrollHeight,
    });
};

describe('useHasOverflow', () => {
    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            const timeoutId = window.setTimeout(() => callback(0), 0);

            return timeoutId;
        });
        vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
            window.clearTimeout(handle);
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sets inline right padding only while vertical overflow exists', async () => {
        render(<OverflowProbe />);

        const element = screen.getByTestId('overflow-probe');

        setElementSize(element, { clientHeight: 100, scrollHeight: 120 });
        act(() => window.dispatchEvent(new Event('resize')));

        await waitFor(() => expect(element.style.paddingRight).toBe('8px'));

        setElementSize(element, { clientHeight: 100, scrollHeight: 90 });
        act(() => window.dispatchEvent(new Event('resize')));

        await waitFor(() => expect(element.style.paddingRight).toBe(''));
    });
});
