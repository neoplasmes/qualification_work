export {
    clearWorkspaceMetricForm,
    dashboardsPageInitialState,
    dashboardsPageSlice,
    initDashboardsWorkspaceDraft,
    resetDashboardsWorkspaceDraft,
    selectDashboard,
    setDashboardsRightPanelTab,
    setDashboardsWorkspaceDraftName,
    setWorkspaceMetricForm,
} from './dashboardsPageSlice';
export type {
    DashboardsPageState,
    DashboardsRightPanelTab,
    WorkspaceMetricForm,
} from './dashboardsPageSlice';
export { dashboardsPagePersistence } from './dashboardsPagePersistence';
