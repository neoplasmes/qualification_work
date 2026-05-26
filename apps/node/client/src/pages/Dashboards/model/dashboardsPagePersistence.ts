import {
    dashboardsPageInitialState,
    type DashboardsPageState,
} from './dashboardsPageSlice';

type DashboardsPagePersisted = Pick<
    DashboardsPageState,
    | 'selectedDashboardId'
    | 'filterChartIds'
    | 'filterDatasetIds'
    | 'dashboardsFilterActiveTab'
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
        filterChartIds: [],
        filterDatasetIds: [],
        dashboardsFilterActiveTab: 'charts',
        workspaceDraftDashboardId: null,
        workspaceDraftName: '',
        workspaceMetricName: '',
        workspaceMetricExpression: '',
        workspaceMetricFormat: 'number',
    } satisfies DashboardsPagePersisted,
    getInitialState: (persistedState: DashboardsPagePersisted): DashboardsPageState => ({
        ...dashboardsPageInitialState,
        ...persistedState,
    }),
    pickPersistedState: (state: DashboardsPageState): DashboardsPagePersisted => ({
        selectedDashboardId: state.selectedDashboardId,
        filterChartIds: state.filterChartIds,
        filterDatasetIds: state.filterDatasetIds,
        dashboardsFilterActiveTab: state.dashboardsFilterActiveTab,
        workspaceDraftDashboardId: state.workspaceDraftDashboardId,
        workspaceDraftName: state.workspaceDraftName,
        workspaceMetricName: state.workspaceMetricName,
        workspaceMetricExpression: state.workspaceMetricExpression,
        workspaceMetricFormat: state.workspaceMetricFormat,
    }),
};
