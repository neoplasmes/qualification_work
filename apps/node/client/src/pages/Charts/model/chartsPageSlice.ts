import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ChartBuilderFields } from '@/features/buildChart';

export type ChartsRightPanelTab = 'properties' | 'filters';
export type ChartsWorkspaceMode = 'view' | 'edit';

export type ChartsEditDraft = {
    chartId: string;
    fields: ChartBuilderFields;
};

export type ChartsPageState = {
    selectedChartId: string | null;
    builderDatasetId: string | null;
    showDatasetPicker: boolean;
    chartsRightPanelTab: ChartsRightPanelTab;
    workspaceMode: ChartsWorkspaceMode;
    editDraft: ChartsEditDraft | null;
};

type StateWithChartsPage = { chartsPage: ChartsPageState };

export const chartsPageInitialState: ChartsPageState = {
    selectedChartId: null,
    builderDatasetId: null,
    showDatasetPicker: false,
    chartsRightPanelTab: 'properties',
    workspaceMode: 'view',
    editDraft: null,
};

export const chartsPageSlice = createSlice({
    name: 'chartsPage',
    initialState: chartsPageInitialState,
    reducers: {
        selectChart(state, action: PayloadAction<string | null>) {
            const chartChanged = state.selectedChartId !== action.payload;

            state.selectedChartId = action.payload;
            state.builderDatasetId = null;
            state.showDatasetPicker = false;

            if (chartChanged) {
                state.workspaceMode = 'view';
                state.editDraft = null;
            }
        },
        openChartRoute(
            state,
            action: PayloadAction<{
                chartId: string;
                mode: ChartsWorkspaceMode;
            }>
        ) {
            const chartChanged = state.selectedChartId !== action.payload.chartId;

            state.selectedChartId = action.payload.chartId;
            state.builderDatasetId = null;
            state.showDatasetPicker = false;
            state.workspaceMode = action.payload.mode;

            if (chartChanged) {
                state.editDraft = null;
            }
        },
        setBuilderDatasetId(state, action: PayloadAction<string | null>) {
            state.builderDatasetId = action.payload;
            state.selectedChartId = null;
            state.showDatasetPicker = false;
            state.workspaceMode = 'view';
            state.editDraft = null;
        },
        setShowDatasetPicker(state, action: PayloadAction<boolean>) {
            state.showDatasetPicker = action.payload;
        },
        setChartsRightPanelTab(state, action: PayloadAction<ChartsRightPanelTab>) {
            state.chartsRightPanelTab = action.payload;
        },
        setChartsWorkspaceMode(state, action: PayloadAction<ChartsWorkspaceMode>) {
            state.workspaceMode = action.payload;
        },
        setChartEditDraft(state, action: PayloadAction<ChartsEditDraft>) {
            state.editDraft = action.payload;
        },
        clearChartEditDraft(state, action: PayloadAction<string | undefined>) {
            if (!action.payload || state.editDraft?.chartId === action.payload) {
                state.editDraft = null;
            }
        },
    },
});

export const {
    clearChartEditDraft,
    openChartRoute,
    selectChart,
    setBuilderDatasetId,
    setChartEditDraft,
    setShowDatasetPicker,
    setChartsRightPanelTab,
    setChartsWorkspaceMode,
} = chartsPageSlice.actions;

export const selectSelectedChartId = (state: StateWithChartsPage) =>
    state.chartsPage.selectedChartId;
export const selectBuilderDatasetId = (state: StateWithChartsPage) =>
    state.chartsPage.builderDatasetId;
export const selectShowDatasetPicker = (state: StateWithChartsPage) =>
    state.chartsPage.showDatasetPicker;
export const selectChartsRightPanelTab = (state: StateWithChartsPage) =>
    state.chartsPage.chartsRightPanelTab;
export const selectChartsWorkspaceMode = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceMode;
export const selectChartEditDraft = (state: StateWithChartsPage) =>
    state.chartsPage.editDraft;
