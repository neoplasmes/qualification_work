import {
    dashboardsPageInitialState,
    type DashboardsPageState,
} from './dashboardsPageSlice';

type DashboardsPagePersisted = Pick<
    DashboardsPageState,
    'selectedDashboardId' | 'workspaceDraftDashboardId' | 'workspaceDraftName'
>;

export const dashboardsPagePersistence = {
    key: 'dashboardsPage_v1',
    fallbackState: {
        selectedDashboardId: null,
        workspaceDraftDashboardId: null,
        workspaceDraftName: '',
    } satisfies DashboardsPagePersisted,
    getInitialState: (persistedState: DashboardsPagePersisted): DashboardsPageState => ({
        ...dashboardsPageInitialState,
        selectedDashboardId: persistedState.selectedDashboardId,
        workspaceDraftDashboardId: persistedState.workspaceDraftDashboardId,
        workspaceDraftName: persistedState.workspaceDraftName,
    }),
    pickPersistedState: (state: DashboardsPageState): DashboardsPagePersisted => ({
        selectedDashboardId: state.selectedDashboardId,
        workspaceDraftDashboardId: state.workspaceDraftDashboardId,
        workspaceDraftName: state.workspaceDraftName,
    }),
};
