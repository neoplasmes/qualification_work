import { renderWidgets } from '.';
import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { gridMocks } from './DashboardWidgets.gridStackMock';

beforeEach(() => gridMocks.reset());
afterEach(() => vi.restoreAllMocks());

it('releases handlers and registers one pair after remount', async () => {
    const first = renderWidgets();
    await waitFor(() => expect(gridMocks.handlers.size).toBe(2));
    first.unmount();
    expect(gridMocks.handlers.size).toBe(0);
    expect(gridMocks.grid.destroy).toHaveBeenCalledOnce();
    gridMocks.reset();
    const onLayoutChange = vi.fn();
    const second = renderWidgets({ onLayoutChange });
    await waitFor(() => expect(gridMocks.handlers.size).toBe(2));
    act(() => gridMocks.emit('dragstop'));
    expect(onLayoutChange).toHaveBeenCalledOnce();
    second.unmount();
    expect(gridMocks.handlers.size).toBe(0);
});

it('stacks phone widgets and suppresses geometry writes', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390);
    const onLayoutChange = vi.fn();
    renderWidgets({ onLayoutChange });
    await waitFor(() => expect(gridMocks.grid.getColumn()).toBe(1));
    expect(gridMocks.grid.engine.nodes.every(node => node.x === 0 && node.w === 1)).toBe(
        true
    );
    expect(gridMocks.grid.enableMove).toHaveBeenLastCalledWith(false);
    expect(gridMocks.grid.enableResize).toHaveBeenLastCalledWith(false);
    act(() => {
        gridMocks.emit('dragstop');
        gridMocks.emit('resizestop');
    });
    expect(onLayoutChange).not.toHaveBeenCalled();
});
