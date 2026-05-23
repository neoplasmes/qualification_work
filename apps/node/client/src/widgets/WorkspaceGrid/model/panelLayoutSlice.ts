import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type PanelLayoutState = {
    sizes: Record<string, number[]>;
    isLeftCollapsed: boolean;
    isRightCollapsed: boolean;
};

type StateWithPanelLayout = { panelLayout: PanelLayoutState };

const initialState: PanelLayoutState = {
    sizes: {},
    isLeftCollapsed: false,
    isRightCollapsed: false,
};

export const panelLayoutSlice = createSlice({
    name: 'panelLayout',
    initialState,
    reducers: {
        setPanelSizes(state, action: PayloadAction<{ pageKey: string; sizes: number[] }>) {
            state.sizes[action.payload.pageKey] = action.payload.sizes;
        },
        toggleLeftPanel(state) {
            state.isLeftCollapsed = !state.isLeftCollapsed;
        },
        toggleRightPanel(state) {
            state.isRightCollapsed = !state.isRightCollapsed;
        },
    },
});

export const { setPanelSizes, toggleLeftPanel, toggleRightPanel } = panelLayoutSlice.actions;

export const selectPanelSizes =
    (pageKey: string) =>
    (state: StateWithPanelLayout): number[] | undefined =>
        state.panelLayout.sizes[pageKey];

export const selectIsLeftCollapsed = (state: StateWithPanelLayout) =>
    state.panelLayout.isLeftCollapsed;

export const selectIsRightCollapsed = (state: StateWithPanelLayout) =>
    state.panelLayout.isRightCollapsed;
