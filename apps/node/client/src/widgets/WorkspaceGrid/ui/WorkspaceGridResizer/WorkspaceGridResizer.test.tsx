import { fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkspaceGridPanelModel } from '../../model';
import { WorkspaceGridResizer } from './WorkspaceGridResizer';

// fake model exposing only what the resizer touches, with a controllable size
const fakeModel = (size: number, min: number, max: number) => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: size });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: size });

    const setSizePx = vi.fn();

    return {
        model: {
            getElement: () => el,
            getMinSizePx: () => min,
            getMaxSizePx: () => max,
            setSizePx,
        } as unknown as WorkspaceGridPanelModel,
        setSizePx,
    };
};

const getHandle = (container: HTMLElement) =>
    container.firstChild!.firstChild as HTMLElement;

beforeEach(() => {
    // run the raf-throttled resize synchronously
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        cb(0);

        return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('WorkspaceGridResizer', () => {
    it('resizes both neighbours within their limits on drag', () => {
        const prev = fakeModel(300, 100, 800);
        const next = fakeModel(300, 100, 800);

        const { container } = render(
            <WorkspaceGridResizer direction="row" prev={prev.model} next={next.model} />
        );

        const handle = getHandle(container);
        handle.setPointerCapture = vi.fn();

        fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
        fireEvent.pointerMove(handle, { pointerId: 1, clientX: 150 });

        expect(prev.setSizePx).toHaveBeenCalledWith(350);
        expect(next.setSizePx).toHaveBeenCalledWith(250);
    });

    it('clamps the delta to the neighbours min/max', () => {
        const prev = fakeModel(300, 100, 400);
        const next = fakeModel(300, 100, 800);

        const { container } = render(
            <WorkspaceGridResizer direction="row" prev={prev.model} next={next.model} />
        );

        const handle = getHandle(container);
        handle.setPointerCapture = vi.fn();

        fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
        // huge delta, prev capped at max 400 -> +100
        fireEvent.pointerMove(handle, { pointerId: 1, clientX: 5000 });

        expect(prev.setSizePx).toHaveBeenCalledWith(400);
        expect(next.setSizePx).toHaveBeenCalledWith(200);
    });

    it('calls onResizeEnd on pointer up', () => {
        const prev = fakeModel(300, 100, 800);
        const next = fakeModel(300, 100, 800);
        const onResizeEnd = createRef<() => void>() as React.MutableRefObject<() => void>;
        onResizeEnd.current = vi.fn();

        const { container } = render(
            <WorkspaceGridResizer
                direction="row"
                prev={prev.model}
                next={next.model}
                onResizeEnd={onResizeEnd}
            />
        );

        const handle = getHandle(container);
        handle.setPointerCapture = vi.fn();

        fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
        fireEvent.pointerUp(handle, { pointerId: 1 });

        expect(onResizeEnd.current).toHaveBeenCalledOnce();
    });

    it('ignores moves from a different pointer', () => {
        const prev = fakeModel(300, 100, 800);
        const next = fakeModel(300, 100, 800);

        const { container } = render(
            <WorkspaceGridResizer direction="row" prev={prev.model} next={next.model} />
        );

        const handle = getHandle(container);
        handle.setPointerCapture = vi.fn();

        fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
        fireEvent.pointerMove(handle, { pointerId: 2, clientX: 150 });

        expect(prev.setSizePx).not.toHaveBeenCalled();
    });

    it('uses the vertical axis for column direction', () => {
        const prev = fakeModel(300, 100, 800);
        const next = fakeModel(300, 100, 800);

        const { container } = render(
            <WorkspaceGridResizer
                direction="column"
                prev={prev.model}
                next={next.model}
            />
        );

        const handle = getHandle(container);
        handle.setPointerCapture = vi.fn();

        fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
        fireEvent.pointerMove(handle, { pointerId: 1, clientY: 60 });

        expect(prev.setSizePx).toHaveBeenCalledWith(260);
        expect(next.setSizePx).toHaveBeenCalledWith(340);
    });
});
