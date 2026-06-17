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
    valueMultiplier: string;
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
    workspaceMetricValueMultiplier: string;
    workspaceMetricTarget: string;
    workspaceMetricTargetDirection: MetricTargetDirection;
    workspaceMetricShowTrend: boolean;
    workspaceMetricTimeColumn: string;
    workspaceMetricTimeBucket: MetricTimeBucket | '';
};

const emptyMetricExtras = {
    workspaceMetricTarget: '',
    workspaceMetricValueMultiplier: '1',
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
    workspaceMetricFormat: '',
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
        clearWorkspaceMetricForm(state) {
            state.workspaceMetricName = '';
            state.workspaceMetricExpression = '';
            state.workspaceMetricFormat = '';
            Object.assign(state, emptyMetricExtras);
        },
        setWorkspaceMetricForm(state, action: PayloadAction<WorkspaceMetricForm>) {
            state.workspaceMetricName = action.payload.name;
            state.workspaceMetricExpression = action.payload.expression;
            state.workspaceMetricFormat = action.payload.format;
            state.workspaceMetricValueMultiplier = action.payload.valueMultiplier;
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
    clearWorkspaceMetricForm,
    setWorkspaceMetricForm,
} = dashboardsPageSlice.actions;
