import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DashboardsRightPanelTab = 'properties' | 'filters';

export type DashboardsPageState = {
    selectedDashboardId: string | null;
    filterChartIds: string[];
    filterDatasetIds: string[];
    dashboardsFilterActiveTab: 'charts' | 'datasets';
    dashboardsRightPanelTab: DashboardsRightPanelTab;
    workspaceDraftDashboardId: string | null;
    workspaceDraftName: string;
    workspaceMetricName: string;
    workspaceMetricExpression: string;
    workspaceMetricFormat: 'currency' | 'percent' | 'number';
};

type StateWithDashboardsPage = { dashboardsPage: DashboardsPageState };

export const dashboardsPageInitialState: DashboardsPageState = {
    selectedDashboardId: null,
    filterChartIds: [],
    filterDatasetIds: [],
    dashboardsFilterActiveTab: 'charts',
    dashboardsRightPanelTab: 'properties',
    workspaceDraftDashboardId: null,
    workspaceDraftName: '',
    workspaceMetricName: '',
    workspaceMetricExpression: '',
    workspaceMetricFormat: 'number',
};

export const dashboardsPageSlice = createSlice({
    name: 'dashboardsPage',
    initialState: dashboardsPageInitialState,
    reducers: {
        selectDashboard(state, action: PayloadAction<string | null>) {
            state.selectedDashboardId = action.payload;
        },
        toggleChartFilter(state, action: PayloadAction<string>) {
            const id = action.payload;
            const idx = state.filterChartIds.indexOf(id);
            if (idx >= 0) {
                state.filterChartIds.splice(idx, 1);
            } else {
                state.filterChartIds.push(id);
            }
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
        clearChartFilter(state) {
            state.filterChartIds = [];
        },
        clearDatasetFilter(state) {
            state.filterDatasetIds = [];
        },
        setDashboardsFilterActiveTab(
            state,
            action: PayloadAction<'charts' | 'datasets'>
        ) {
            state.dashboardsFilterActiveTab = action.payload;
        },
        setDashboardsRightPanelTab(
            state,
            action: PayloadAction<DashboardsRightPanelTab>
        ) {
            state.dashboardsRightPanelTab = action.payload;
        },
        initDashboardsWorkspaceDraft(
            state,
            action: PayloadAction<{ dashboardId: string; name: string }>
        ) {
            state.workspaceDraftDashboardId = action.payload.dashboardId;
            state.workspaceDraftName = action.payload.name;
        },
        resetDashboardsWorkspaceDraft(state) {
            state.workspaceDraftDashboardId = null;
            state.workspaceDraftName = '';
        },
        setDashboardsWorkspaceDraftName(state, action: PayloadAction<string>) {
            state.workspaceDraftName = action.payload;
        },
        setWorkspaceMetricName(state, action: PayloadAction<string>) {
            state.workspaceMetricName = action.payload;
        },
        setWorkspaceMetricExpression(state, action: PayloadAction<string>) {
            state.workspaceMetricExpression = action.payload;
        },
        setWorkspaceMetricFormat(
            state,
            action: PayloadAction<'currency' | 'percent' | 'number'>
        ) {
            state.workspaceMetricFormat = action.payload;
        },
        clearWorkspaceMetricForm(state) {
            state.workspaceMetricName = '';
            state.workspaceMetricExpression = '';
            state.workspaceMetricFormat = 'number';
        },
    },
});

export const {
    selectDashboard,
    toggleChartFilter,
    toggleDatasetFilter,
    clearChartFilter,
    clearDatasetFilter,
    setDashboardsFilterActiveTab,
    setDashboardsRightPanelTab,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricName,
    setWorkspaceMetricExpression,
    setWorkspaceMetricFormat,
    clearWorkspaceMetricForm,
} = dashboardsPageSlice.actions;

export const selectSelectedDashboardId = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.selectedDashboardId;
export const selectFilterChartIds = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.filterChartIds;
export const selectFilterDatasetIds = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.filterDatasetIds;
export const selectDashboardsFilterActiveTab = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.dashboardsFilterActiveTab;
export const selectDashboardsRightPanelTab = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.dashboardsRightPanelTab;
export const selectWorkspaceDraftDashboardId = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceDraftDashboardId;
export const selectDashboardsWorkspaceDraftName = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceDraftName;
export const selectWorkspaceMetricName = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricName;
export const selectWorkspaceMetricExpression = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricExpression;
export const selectWorkspaceMetricFormat = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricFormat;
