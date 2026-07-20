import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

export type PanelLayoutState = {
    sizes: Record<string, number[]>;
    isLeftCollapsed: boolean;
    isRightCollapsed: boolean;
};

const initialState: PanelLayoutState = {
    sizes: {},
    isLeftCollapsed: false,
    isRightCollapsed: false,
};

export type PanelLayoutStateStore = PanelLayoutState & {
    setPanelSizes(value: { pageKey: string; sizes: number[] }): void;
    toggleLeftPanel(): void;
    toggleRightPanel(): void;
};

export function createPanelLayoutStore(initial: Partial<PanelLayoutState> = {}) {
    return createStore<PanelLayoutStateStore>()(
        immer(set => ({
            ...initialState,
            ...initial,
            setPanelSizes: value =>
                set(state => {
                    state.sizes[value.pageKey] = value.sizes;
                }),
            toggleLeftPanel: () =>
                set(state => {
                    state.isLeftCollapsed = !state.isLeftCollapsed;
                }),
            toggleRightPanel: () =>
                set(state => {
                    state.isRightCollapsed = !state.isRightCollapsed;
                }),
        }))
    );
}
