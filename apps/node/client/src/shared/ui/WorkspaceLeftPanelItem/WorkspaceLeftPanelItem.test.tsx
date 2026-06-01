import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceLeftPanelItem } from './WorkspaceLeftPanelItem';

const handleClick = vi.fn();

const mockAnimationFrame = () => {
    const callbacks: FrameRequestCallback[] = [];

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callbacks.push(callback);

        return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    return () => {
        callbacks.splice(0).forEach(callback => callback(0));
    };
};

const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: width,
    });
};

const setHeaderSize = (
    element: HTMLElement,
    { clientWidth, scrollWidth }: { clientWidth: number; scrollWidth: number }
) => {
    Object.defineProperty(element, 'clientWidth', {
        configurable: true,
        value: clientWidth,
    });
    Object.defineProperty(element, 'scrollWidth', {
        configurable: true,
        value: scrollWidth,
    });
};

describe('WorkspaceLeftPanelItem', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('shows full header tooltip on pointer enter when header is truncated', () => {
        const title = 'Massively long action title that does not fit';

        render(<WorkspaceLeftPanelItem header={title} onClick={handleClick} />);

        const button = screen.getByRole('button', { name: title });
        const header = screen.getByText(title);
        setHeaderSize(header, { clientWidth: 120, scrollWidth: 240 });

        fireEvent.pointerEnter(button);

        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent(title);
        expect(button).toHaveAttribute('aria-describedby', tooltip.id);

        fireEvent.pointerLeave(button);

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-describedby');
    });

    it('shows full header tooltip on focus when header is truncated', () => {
        const title = 'Focused item with very long title';

        render(<WorkspaceLeftPanelItem header={title} onClick={handleClick} />);

        const button = screen.getByRole('button', { name: title });
        const header = screen.getByText(title);
        setHeaderSize(header, { clientWidth: 100, scrollWidth: 220 });

        fireEvent.focus(button);

        expect(screen.getByRole('tooltip')).toHaveTextContent(title);
        expect(button).toHaveAttribute('aria-describedby');
    });

    it('does not show tooltip when header fits', () => {
        const title = 'Short title';

        render(<WorkspaceLeftPanelItem header={title} onClick={handleClick} />);

        const button = screen.getByRole('button', { name: title });
        const header = screen.getByText(title);
        setHeaderSize(header, { clientWidth: 160, scrollWidth: 120 });

        fireEvent.pointerEnter(button);

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-describedby');
    });

    it('places tooltip to the left of the pointer near the viewport edge', () => {
        const title = 'Massively long action title that does not fit near the edge';
        const flushAnimationFrame = mockAnimationFrame();
        setViewportWidth(400);

        render(<WorkspaceLeftPanelItem header={title} onClick={handleClick} />);

        const button = screen.getByRole('button', { name: title });
        const header = screen.getByText(title);
        setHeaderSize(header, { clientWidth: 120, scrollWidth: 260 });

        fireEvent.pointerEnter(button, { clientX: 360, clientY: 40 });

        const tooltip = screen.getByRole('tooltip');
        flushAnimationFrame();

        expect(tooltip).toHaveAttribute('data-placement', 'left');
        expect(tooltip.style.getPropertyValue('--tooltip-x')).toBe('360px');
        expect(tooltip.style.getPropertyValue('--tooltip-y')).toBe('48px');
    });
});
