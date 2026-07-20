import { dashboardsPageInitialState, type DashboardsPageState } from './pageState.store';

type DashboardsPagePersisted = { selectedDashboardId: string | null } & Pick<
    DashboardsPageState,
    'workspaceDraftDashboardId' | 'workspaceDraftName'
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
        rememberedDashboardId: persistedState.selectedDashboardId,
        workspaceDraftDashboardId: persistedState.workspaceDraftDashboardId,
        workspaceDraftName: persistedState.workspaceDraftName,
    }),
    pickPersistedState: (state: DashboardsPageState): DashboardsPagePersisted => ({
        selectedDashboardId: state.rememberedDashboardId,
        workspaceDraftDashboardId: state.workspaceDraftDashboardId,
        workspaceDraftName: state.workspaceDraftName,
    }),
};
