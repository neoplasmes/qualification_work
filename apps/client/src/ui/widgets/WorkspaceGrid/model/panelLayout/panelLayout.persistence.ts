import type { PanelLayoutState } from './panelLayout.store';

export const panelLayoutPersistence = {
    key: 'panelLayout_v2',
    fallbackState: {
        sizes: {},
        isLeftCollapsed: false,
        isRightCollapsed: false,
    } satisfies PanelLayoutState,
    getInitialState: (persistedState: PanelLayoutState): PanelLayoutState =>
        persistedState,
    pickPersistedState: (state: PanelLayoutState): PanelLayoutState => ({
        sizes: state.sizes,
        isLeftCollapsed: state.isLeftCollapsed,
        isRightCollapsed: state.isRightCollapsed,
    }),
};
