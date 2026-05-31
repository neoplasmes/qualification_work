import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ChartType } from '@/entities/chart';

export type ChartsRightPanelTab = 'properties' | 'filters';

export type ChartsPageState = {
    selectedChartId: string | null;
    builderDatasetId: string | null;
    showDatasetPicker: boolean;
    chartsRightPanelTab: ChartsRightPanelTab;
    workspaceDraftChartId: string | null;
    workspaceDraftName: string;
    workspaceDraftChartType: ChartType;
    workspaceDraftConfigText: string;
    workspaceFilterOverrideText: string;
};

type StateWithChartsPage = { chartsPage: ChartsPageState };

export const chartsPageInitialState: ChartsPageState = {
    selectedChartId: null,
    builderDatasetId: null,
    showDatasetPicker: false,
    chartsRightPanelTab: 'properties',
    workspaceDraftChartId: null,
    workspaceDraftName: '',
    workspaceDraftChartType: 'bar',
    workspaceDraftConfigText: '',
    workspaceFilterOverrideText: '',
};

export const chartsPageSlice = createSlice({
    name: 'chartsPage',
    initialState: chartsPageInitialState,
    reducers: {
        selectChart(state, action: PayloadAction<string | null>) {
            state.selectedChartId = action.payload;
            state.builderDatasetId = null;
        },
        setBuilderDatasetId(state, action: PayloadAction<string | null>) {
            state.builderDatasetId = action.payload;
            state.selectedChartId = null;
            state.showDatasetPicker = false;
        },
        setShowDatasetPicker(state, action: PayloadAction<boolean>) {
            state.showDatasetPicker = action.payload;
        },
        setChartsRightPanelTab(state, action: PayloadAction<ChartsRightPanelTab>) {
            state.chartsRightPanelTab = action.payload;
        },
        initWorkspaceDraft(
            state,
            action: PayloadAction<{
                chartId: string;
                name: string;
                chartType: ChartType;
                configText: string;
            }>
        ) {
            state.workspaceDraftChartId = action.payload.chartId;
            state.workspaceDraftName = action.payload.name;
            state.workspaceDraftChartType = action.payload.chartType;
            state.workspaceDraftConfigText = action.payload.configText;
            state.workspaceFilterOverrideText = '';
        },
        resetWorkspaceDraft(state) {
            state.workspaceDraftChartId = null;
            state.workspaceDraftName = '';
            state.workspaceDraftChartType = 'bar';
            state.workspaceDraftConfigText = '';
            state.workspaceFilterOverrideText = '';
        },
        setWorkspaceDraftName(state, action: PayloadAction<string>) {
            state.workspaceDraftName = action.payload;
        },
        setWorkspaceDraftChartType(state, action: PayloadAction<ChartType>) {
            state.workspaceDraftChartType = action.payload;
        },
        setWorkspaceDraftConfigText(state, action: PayloadAction<string>) {
            state.workspaceDraftConfigText = action.payload;
        },
        setWorkspaceFilterOverrideText(state, action: PayloadAction<string>) {
            state.workspaceFilterOverrideText = action.payload;
        },
    },
});

export const {
    selectChart,
    setBuilderDatasetId,
    setShowDatasetPicker,
    setChartsRightPanelTab,
    initWorkspaceDraft,
    resetWorkspaceDraft,
    setWorkspaceDraftName,
    setWorkspaceDraftChartType,
    setWorkspaceDraftConfigText,
    setWorkspaceFilterOverrideText,
} = chartsPageSlice.actions;

export const selectSelectedChartId = (state: StateWithChartsPage) =>
    state.chartsPage.selectedChartId;
export const selectBuilderDatasetId = (state: StateWithChartsPage) =>
    state.chartsPage.builderDatasetId;
export const selectShowDatasetPicker = (state: StateWithChartsPage) =>
    state.chartsPage.showDatasetPicker;
export const selectChartsRightPanelTab = (state: StateWithChartsPage) =>
    state.chartsPage.chartsRightPanelTab;
export const selectWorkspaceDraftChartId = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceDraftChartId;
export const selectWorkspaceDraftName = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceDraftName;
export const selectWorkspaceDraftChartType = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceDraftChartType;
export const selectWorkspaceDraftConfigText = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceDraftConfigText;
export const selectWorkspaceFilterOverrideText = (state: StateWithChartsPage) =>
    state.chartsPage.workspaceFilterOverrideText;
