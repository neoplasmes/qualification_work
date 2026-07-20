import { useDependencies } from '@/ui/di/dependencies';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useStore } from 'zustand';

import {
    getDashboardWorkspaceUrl,
    isDashboardsWorkspacePath,
} from '../../lib/dashboardWorkspaceRoute';

export function useDashboardsWorkspaceRouteSync() {
    const store = useDependencies().ui.dashboards;
    const remembered = useStore(store, state => state.rememberedDashboardId);
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isDashboardsWorkspacePath(location.pathname)) {
            return;
        }
        const id = new URLSearchParams(location.search).get('id');
        if (id) {
            if (store.getState().rememberedDashboardId !== id) {
                store.getState().selectDashboard(id);
            }

            return;
        }
    }, [location.pathname, location.search, store]);

    useEffect(() => {
        if (
            !isDashboardsWorkspacePath(location.pathname) ||
            new URLSearchParams(location.search).get('id')
        ) {
            return;
        }
        if (remembered) {
            navigate(getDashboardWorkspaceUrl(remembered), { replace: true });
        }
    }, [location.pathname, location.search, remembered, navigate, store]);
}
