import type {
    MetricFormat,
    MetricTargetDirection,
    MetricTimeBucket,
} from '@qualification-work/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DashboardsRightPanelTab = 'properties' | 'filters';

/**
 * editable metric form state, '' on target/timeColumn/timeBucket means "none/auto"
 */
export type WorkspaceMetricForm = {
    name: string;
    expression: string;
    format: MetricFormat;
    target: string;
    targetDirection: MetricTargetDirection;
    showTrend: boolean;
    timeColumn: string;
    timeBucket: MetricTimeBucket | '';
};

export type DashboardsPageState = {
    selectedDashboardId: string | null;
    dashboardsRightPanelTab: DashboardsRightPanelTab;
    workspaceDraftDashboardId: string | null;
    workspaceDraftName: string;
    workspaceMetricName: string;
    workspaceMetricExpression: string;
    workspaceMetricFormat: MetricFormat;
    workspaceMetricTarget: string;
    workspaceMetricTargetDirection: MetricTargetDirection;
    workspaceMetricShowTrend: boolean;
    workspaceMetricTimeColumn: string;
    workspaceMetricTimeBucket: MetricTimeBucket | '';
};

type StateWithDashboardsPage = { dashboardsPage: DashboardsPageState };

const emptyMetricExtras = {
    workspaceMetricTarget: '',
    workspaceMetricTargetDirection: 'higher',
    workspaceMetricShowTrend: false,
    workspaceMetricTimeColumn: '',
    workspaceMetricTimeBucket: '',
} satisfies Partial<DashboardsPageState>;

export const dashboardsPageInitialState: DashboardsPageState = {
    selectedDashboardId: null,
    dashboardsRightPanelTab: 'properties',
    workspaceDraftDashboardId: null,
    workspaceDraftName: '',
    workspaceMetricName: '',
    workspaceMetricExpression: '',
    workspaceMetricFormat: 'number',
    ...emptyMetricExtras,
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
        setWorkspaceMetricFormat(state, action: PayloadAction<MetricFormat>) {
            state.workspaceMetricFormat = action.payload;
        },
        setWorkspaceMetricTarget(state, action: PayloadAction<string>) {
            state.workspaceMetricTarget = action.payload;
        },
        setWorkspaceMetricTargetDirection(
            state,
            action: PayloadAction<MetricTargetDirection>
        ) {
            state.workspaceMetricTargetDirection = action.payload;
        },
        setWorkspaceMetricShowTrend(state, action: PayloadAction<boolean>) {
            state.workspaceMetricShowTrend = action.payload;
        },
        setWorkspaceMetricTimeColumn(state, action: PayloadAction<string>) {
            state.workspaceMetricTimeColumn = action.payload;
        },
        setWorkspaceMetricTimeBucket(
            state,
            action: PayloadAction<MetricTimeBucket | ''>
        ) {
            state.workspaceMetricTimeBucket = action.payload;
        },
        clearWorkspaceMetricForm(state) {
            state.workspaceMetricName = '';
            state.workspaceMetricExpression = '';
            state.workspaceMetricFormat = 'number';
            Object.assign(state, emptyMetricExtras);
        },
        setWorkspaceMetricForm(state, action: PayloadAction<WorkspaceMetricForm>) {
            state.workspaceMetricName = action.payload.name;
            state.workspaceMetricExpression = action.payload.expression;
            state.workspaceMetricFormat = action.payload.format;
            state.workspaceMetricTarget = action.payload.target;
            state.workspaceMetricTargetDirection = action.payload.targetDirection;
            state.workspaceMetricShowTrend = action.payload.showTrend;
            state.workspaceMetricTimeColumn = action.payload.timeColumn;
            state.workspaceMetricTimeBucket = action.payload.timeBucket;
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
    setWorkspaceMetricTarget,
    setWorkspaceMetricTargetDirection,
    setWorkspaceMetricShowTrend,
    setWorkspaceMetricTimeColumn,
    setWorkspaceMetricTimeBucket,
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
export const selectWorkspaceMetricTarget = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricTarget;
export const selectWorkspaceMetricTargetDirection = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricTargetDirection;
export const selectWorkspaceMetricShowTrend = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricShowTrend;
export const selectWorkspaceMetricTimeColumn = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricTimeColumn;
export const selectWorkspaceMetricTimeBucket = (state: StateWithDashboardsPage) =>
    state.dashboardsPage.workspaceMetricTimeBucket;
