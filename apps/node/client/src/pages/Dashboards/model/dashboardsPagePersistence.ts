import {
    dashboardsPageInitialState,
    type DashboardsPageState,
} from './dashboardsPageSlice';

type DashboardsPagePersisted = Pick<
    DashboardsPageState,
    | 'selectedDashboardId'
    | 'workspaceDraftDashboardId'
    | 'workspaceDraftName'
    | 'workspaceMetricName'
    | 'workspaceMetricExpression'
    | 'workspaceMetricFormat'
>;

export const dashboardsPagePersistence = {
    key: 'dashboardsPage_v1',
    fallbackState: {
        selectedDashboardId: null,
        workspaceDraftDashboardId: null,
        workspaceDraftName: '',
        workspaceMetricName: '',
        workspaceMetricExpression: '',
        workspaceMetricFormat: 'number',
    } satisfies DashboardsPagePersisted,
    getInitialState: (persistedState: DashboardsPagePersisted): DashboardsPageState => ({
        ...dashboardsPageInitialState,
        selectedDashboardId: persistedState.selectedDashboardId,
        workspaceDraftDashboardId: persistedState.workspaceDraftDashboardId,
        workspaceDraftName: persistedState.workspaceDraftName,
        workspaceMetricName: persistedState.workspaceMetricName,
        workspaceMetricExpression: persistedState.workspaceMetricExpression,
        workspaceMetricFormat: persistedState.workspaceMetricFormat,
    }),
    pickPersistedState: (state: DashboardsPageState): DashboardsPagePersisted => ({
        selectedDashboardId: state.selectedDashboardId,
        workspaceDraftDashboardId: state.workspaceDraftDashboardId,
        workspaceDraftName: state.workspaceDraftName,
        workspaceMetricName: state.workspaceMetricName,
        workspaceMetricExpression: state.workspaceMetricExpression,
        workspaceMetricFormat: state.workspaceMetricFormat,
    }),
};
