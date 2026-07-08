export { DashboardsPage } from './DashboardsPage';
export { DashboardsLeftPanel, DashboardsRightPanel } from './ui';
export {
    dashboardsWorkspaceIndexPath,
    getDashboardIdFromSearch,
    getDashboardWorkspaceUrl,
    isDashboardsWorkspacePath,
} from './lib';
export {
    dashboardsPageSlice,
    dashboardsPageInitialState,
    dashboardsPagePersistence,
    selectDashboard,
} from './model';
export type { DashboardsPageState } from './model';
