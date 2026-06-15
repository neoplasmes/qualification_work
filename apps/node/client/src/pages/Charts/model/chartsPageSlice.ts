import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ChartBuilderDraft, ChartBuilderOutput } from '@/widgets/ChartBuilder';

export type ChartsRightPanelTab = 'properties' | 'filters';
export type ChartsWorkspaceMode = 'view' | 'edit';

export type ChartsEditDraft = {
    chartId: string;
    draft: ChartBuilderDraft;
    output: ChartBuilderOutput | null;
};

export type ChartsCreateDraft = {
    datasetId: string;
    draft: ChartBuilderDraft;
    output: ChartBuilderOutput | null;
};

export type ChartsPageState = {
    selectedChartId: string | null;
    createDraft: ChartsCreateDraft | null;
    showDatasetPicker: boolean;
    chartsRightPanelTab: ChartsRightPanelTab;
    workspaceMode: ChartsWorkspaceMode;
    editDraft: ChartsEditDraft | null;
};

type StateWithChartsPage = { chartsPage: ChartsPageState };

export const chartsPageInitialState: ChartsPageState = {
    selectedChartId: null,
    createDraft: null,
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
            state.createDraft = null;
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
            state.createDraft = null;
            state.showDatasetPicker = false;
            state.workspaceMode = action.payload.mode;

            if (chartChanged) {
                state.editDraft = null;
            }
        },
        openNewChartRoute(state) {
            state.selectedChartId = null;
            state.workspaceMode = 'view';
            state.editDraft = null;
            if (!state.createDraft) {
                state.showDatasetPicker = true;
            }
        },
        setChartCreateDraft(state, action: PayloadAction<ChartsCreateDraft>) {
            state.createDraft = action.payload;
            state.selectedChartId = null;
            state.showDatasetPicker = false;
            state.workspaceMode = 'view';
            state.editDraft = null;
        },
        setChartCreateDraftValue(state, action: PayloadAction<ChartBuilderDraft>) {
            if (state.createDraft) {
                state.createDraft.draft = action.payload;
            }
        },
        setChartCreateOutput(state, action: PayloadAction<ChartBuilderOutput>) {
            if (state.createDraft) {
                state.createDraft.output = action.payload;
            }
        },
        clearChartCreateDraft(state) {
            state.createDraft = null;
            state.showDatasetPicker = false;
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
        setChartEditDraftValue(
            state,
            action: PayloadAction<{ chartId: string; draft: ChartBuilderDraft }>
        ) {
            if (state.editDraft?.chartId === action.payload.chartId) {
                state.editDraft.draft = action.payload.draft;
            }
        },
        setChartEditOutput(
            state,
            action: PayloadAction<{ chartId: string; output: ChartBuilderOutput }>
        ) {
            if (state.editDraft?.chartId === action.payload.chartId) {
                state.editDraft.output = action.payload.output;
            }
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
    clearChartCreateDraft,
    openChartRoute,
    openNewChartRoute,
    selectChart,
    setChartCreateDraft,
    setChartCreateDraftValue,
    setChartCreateOutput,
    setChartEditDraft,
    setChartEditDraftValue,
    setChartEditOutput,
    setShowDatasetPicker,
    setChartsRightPanelTab,
    setChartsWorkspaceMode,
} = chartsPageSlice.actions;

export const selectSelectedChartId = (state: StateWithChartsPage) =>
    state.chartsPage.selectedChartId;
export const selectChartCreateDatasetId = (state: StateWithChartsPage) =>
    state.chartsPage.createDraft?.datasetId ?? null;
export const selectChartCreateDraft = (state: StateWithChartsPage) =>
    state.chartsPage.createDraft;
export const selectShowDatasetPicker = (state: StateWithChartsPage) =>
    state.chartsPage.showDatasetPicker;
export const selectChartsRightPanelTab = (state: StateWithChartsPage) =>
    state.chartsPage.chartsRightPanelTab;
export const selectChartsWorkspaceMode = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceMode;
export const selectChartEditDraft = (state: StateWithChartsPage) =>
    state.chartsPage.editDraft;
