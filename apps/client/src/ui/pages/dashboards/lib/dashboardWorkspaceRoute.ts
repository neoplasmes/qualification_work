const dashboardsBasePath = '/dashboards';

export const dashboardsWorkspaceIndexPath = dashboardsBasePath;

export const isDashboardsWorkspacePath = (pathname: string) =>
    pathname === dashboardsBasePath;

export const getDashboardWorkspaceUrl = (dashboardId: string) =>
    `${dashboardsBasePath}?id=${encodeURIComponent(dashboardId)}`;

export const getDashboardIdFromSearch = (search: string) =>
    new URLSearchParams(search).get('id');
