import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ChartType } from '@/features/charts';

type ChartsPageState = {
    selectedChartId: string | null;
    filterDatasetIds: string[];
    filterDashboardIds: string[];
    builderDatasetId: string | null;
    showDatasetPicker: boolean;
    chartsFilterActiveTab: 'datasets' | 'dashboards';
    workspaceDraftChartId: string | null;
    workspaceDraftName: string;
    workspaceDraftChartType: ChartType;
    workspaceDraftConfigText: string;
    workspaceFilterOverrideText: string;
};

type StateWithChartsPage = { chartsPage: ChartsPageState };

export const chartsPageInitialState: ChartsPageState = {
    selectedChartId: null,
    filterDatasetIds: [],
    filterDashboardIds: [],
    builderDatasetId: null,
    showDatasetPicker: false,
    chartsFilterActiveTab: 'datasets',
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
        toggleDatasetFilter(state, action: PayloadAction<string>) {
            const id = action.payload;
            const idx = state.filterDatasetIds.indexOf(id);
            if (idx >= 0) {
                state.filterDatasetIds.splice(idx, 1);
            } else {
                state.filterDatasetIds.push(id);
            }
        },
        toggleDashboardFilter(state, action: PayloadAction<string>) {
            const id = action.payload;
            const idx = state.filterDashboardIds.indexOf(id);
            if (idx >= 0) {
                state.filterDashboardIds.splice(idx, 1);
            } else {
                state.filterDashboardIds.push(id);
            }
        },
        clearDatasetFilter(state) {
            state.filterDatasetIds = [];
        },
        clearDashboardFilter(state) {
            state.filterDashboardIds = [];
        },
        setBuilderDatasetId(state, action: PayloadAction<string | null>) {
            state.builderDatasetId = action.payload;
            state.selectedChartId = null;
            state.showDatasetPicker = false;
        },
        setShowDatasetPicker(state, action: PayloadAction<boolean>) {
            state.showDatasetPicker = action.payload;
        },
        setChartsFilterActiveTab(state, action: PayloadAction<'datasets' | 'dashboards'>) {
            state.chartsFilterActiveTab = action.payload;
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
    toggleDatasetFilter,
    toggleDashboardFilter,
    clearDatasetFilter,
    clearDashboardFilter,
    setBuilderDatasetId,
    setShowDatasetPicker,
    setChartsFilterActiveTab,
    initWorkspaceDraft,
    resetWorkspaceDraft,
    setWorkspaceDraftName,
    setWorkspaceDraftChartType,
    setWorkspaceDraftConfigText,
    setWorkspaceFilterOverrideText,
} = chartsPageSlice.actions;

export const selectSelectedChartId = (state: StateWithChartsPage) =>
    state.chartsPage.selectedChartId;
export const selectFilterDatasetIds = (state: StateWithChartsPage) =>
    state.chartsPage.filterDatasetIds;
export const selectFilterDashboardIds = (state: StateWithChartsPage) =>
    state.chartsPage.filterDashboardIds;
export const selectBuilderDatasetId = (state: StateWithChartsPage) =>
    state.chartsPage.builderDatasetId;
export const selectShowDatasetPicker = (state: StateWithChartsPage) =>
    state.chartsPage.showDatasetPicker;
export const selectChartsFilterActiveTab = (state: StateWithChartsPage) =>
    state.chartsPage.chartsFilterActiveTab;
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
