export {
    DashboardsPage,
    DashboardsLeftPanel,
    DashboardsWorkspace,
    DashboardsWorkspaceRightPanel,
} from './ui';
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
    selectSelectedDashboardId,
} from './model';
export type { DashboardsPageState } from './model';
