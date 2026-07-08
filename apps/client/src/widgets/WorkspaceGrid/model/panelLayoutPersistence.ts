import type { PanelLayoutState } from './panelLayoutSlice';

export const panelLayoutPersistence = {
    key: 'panelLayout_v2',
    fallbackState: {
        sizes: {},
        isLeftCollapsed: false,
        isRightCollapsed: false,
    } satisfies PanelLayoutState,
    getInitialState: (persistedState: PanelLayoutState): PanelLayoutState =>
        persistedState,
    pickPersistedState: (state: PanelLayoutState): PanelLayoutState => state,
};
