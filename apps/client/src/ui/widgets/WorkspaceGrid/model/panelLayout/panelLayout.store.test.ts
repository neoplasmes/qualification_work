import { expect, it } from 'vitest';

import { createPanelLayoutStore } from './panelLayout.store';

it('isolates layout and persists resize transitions', () => {
    const first = createPanelLayoutStore();
    const second = createPanelLayoutStore();
    const initial = second.getState();
    first.getState().setPanelSizes({ pageKey: 'workspace', sizes: [300, 700, 300] });
    first.getState().toggleLeftPanel();
    expect(first.getState().sizes.workspace).toEqual([300, 700, 300]);
    expect(first.getState().isLeftCollapsed).toBe(true);
    expect(second.getState()).toEqual(initial);
});
