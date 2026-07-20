import { useDependencies } from '@/ui/di/dependencies';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import {
    actionsWorkspaceIndexPath,
    getActionWorkspaceModeFromPath,
    getActionWorkspaceUrl,
} from '../../lib/actionWorkspaceRoute';
import { useActionsPageActions } from './usePageState';

export function useActionsWorkspaceRouteSync() {
    const store = useDependencies().ui.actions;
    const preferences = useStore(
        store,
        useShallow(state => ({
            id: state.rememberedActionId,
            mode: state.rememberedMode,
            isCreatingAction: state.isCreatingAction,
        }))
    );
    const { selectAction, openActionRoute } = useActionsPageActions();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const mode = getActionWorkspaceModeFromPath(location.pathname);
        const id = new URLSearchParams(location.search).get('id');
        if (mode) {
            if (!id) {
                selectAction(null);
                navigate(actionsWorkspaceIndexPath, { replace: true });

                return;
            }
            openActionRoute({ actionId: id, mode });

            return;
        }
    }, [location.pathname, location.search, navigate, selectAction, openActionRoute]);

    useEffect(() => {
        if (location.pathname !== actionsWorkspaceIndexPath) {
            return;
        }
        if (preferences.isCreatingAction) {
            return;
        }
        if (preferences.id) {
            navigate(getActionWorkspaceUrl(preferences.id, preferences.mode), {
                replace: true,
            });
        }
    }, [
        location.pathname,
        location.search,
        navigate,
        selectAction,
        openActionRoute,
        preferences.id,
        preferences.mode,
        preferences.isCreatingAction,
    ]);
}
