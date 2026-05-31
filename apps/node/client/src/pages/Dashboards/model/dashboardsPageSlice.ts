import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DashboardsRightPanelTab = 'properties' | 'filters';

export type DashboardsPageState = {
    selectedDashboardId: string | null;
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
        setWorkspaceMetricForm(
            state,
            action: PayloadAction<{
                name: string;
                expression: string;
                format: 'currency' | 'percent' | 'number';
            }>
        ) {
            state.workspaceMetricName = action.payload.name;
            state.workspaceMetricExpression = action.payload.expression;
            state.workspaceMetricFormat = action.payload.format;
        },
    },
});

export const {
    selectDashboard,
    setDashboardsRightPanelTab,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricName,
    setWorkspaceMetricExpression,
    setWorkspaceMetricFormat,
    clearWorkspaceMetricForm,
    setWorkspaceMetricForm,
} = dashboardsPageSlice.actions;

export const selectSelectedDashboardId = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.selectedDashboardId;
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
