import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import {
    actionsWorkspaceIndexPath,
    getActionWorkspaceModeFromPath,
    getActionWorkspaceUrl,
} from '../../lib';
import { openActionRoute, selectAction, type ActionsWorkspaceMode } from '../../model';

type UseActionsWorkspaceRouteSyncParams = {
    selectedActionId: string | null;
    isCreatingAction: boolean;
    workspaceMode: ActionsWorkspaceMode;
};

export const useActionsWorkspaceRouteSync = ({
    selectedActionId,
    isCreatingAction,
    workspaceMode,
}: UseActionsWorkspaceRouteSyncParams) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const routeMode = getActionWorkspaceModeFromPath(location.pathname);
    const routeActionId = useMemo(
        () => new URLSearchParams(location.search).get('id'),
        [location.search]
    );

    useEffect(() => {
        if (!routeMode) {
            return;
        }

        if (!routeActionId) {
            dispatch(selectAction(null));
            navigate(actionsWorkspaceIndexPath, { replace: true });

            return;
        }

        dispatch(openActionRoute({ actionId: routeActionId, mode: routeMode }));
    }, [dispatch, navigate, routeActionId, routeMode]);

    useEffect(() => {
        if (
            location.pathname !== actionsWorkspaceIndexPath ||
            !selectedActionId ||
            isCreatingAction
        ) {
            return;
        }

        navigate(getActionWorkspaceUrl(selectedActionId, workspaceMode), {
            replace: true,
        });
    }, [isCreatingAction, location.pathname, navigate, selectedActionId, workspaceMode]);
};
