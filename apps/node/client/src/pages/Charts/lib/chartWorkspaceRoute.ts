import type { ChartsWorkspaceMode } from '../model';

const chartsBasePath = '/charts';

export const isChartsWorkspacePath = (pathname: string) =>
    pathname === chartsBasePath || pathname.startsWith(`${chartsBasePath}/`);

export const getChartsWorkspaceBasePath = (pathname: string) =>
    isChartsWorkspacePath(pathname) ? chartsBasePath : pathname;

export const getChartWorkspaceModeFromPath = (
    pathname: string
): ChartsWorkspaceMode | null => {
    if (pathname === `${chartsBasePath}/view`) {
        return 'view';
    }

    if (pathname === `${chartsBasePath}/edit`) {
        return 'edit';
    }

    return null;
};

export const getChartWorkspaceUrl = (chartId: string, mode: ChartsWorkspaceMode) =>
    `${chartsBasePath}/${mode}?id=${encodeURIComponent(chartId)}`;

export const chartsWorkspaceIndexPath = chartsBasePath;
