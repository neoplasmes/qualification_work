import type { ActionsWorkspaceMode } from '../model';

const actionsBasePath = '/actions';

export const isActionsWorkspacePath = (pathname: string) =>
    pathname === actionsBasePath || pathname.startsWith(`${actionsBasePath}/`);

export const getActionsWorkspaceBasePath = (pathname: string) =>
    isActionsWorkspacePath(pathname) ? actionsBasePath : pathname;

export const getActionWorkspaceModeFromPath = (
    pathname: string
): ActionsWorkspaceMode | null => {
    if (pathname === `${actionsBasePath}/view`) {
        return 'view';
    }

    if (pathname === `${actionsBasePath}/edit`) {
        return 'edit';
    }

    return null;
};

export const getActionWorkspaceUrl = (actionId: string, mode: ActionsWorkspaceMode) =>
    `${actionsBasePath}/${mode}?id=${encodeURIComponent(actionId)}`;

export const actionsWorkspaceIndexPath = actionsBasePath;
