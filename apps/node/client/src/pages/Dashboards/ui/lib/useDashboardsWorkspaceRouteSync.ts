import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import {
    dashboardsWorkspaceIndexPath,
    getDashboardIdFromSearch,
    getDashboardWorkspaceUrl,
    isDashboardsWorkspacePath,
} from '../../lib';
import { selectDashboard } from '../../model';

export const useDashboardsWorkspaceRouteSync = (selectedDashboardId: string | null) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const onDashboards = isDashboardsWorkspacePath(location.pathname);
    const routeId = useMemo(
        () => getDashboardIdFromSearch(location.search),
        [location.search]
    );

    useEffect(() => {
        if (!onDashboards || !routeId || routeId === selectedDashboardId) {
            return;
        }

        dispatch(selectDashboard(routeId));
    }, [dispatch, onDashboards, routeId, selectedDashboardId]);

    useEffect(() => {
        if (!onDashboards || routeId === selectedDashboardId) {
            return;
        }

        if (selectedDashboardId) {
            navigate(getDashboardWorkspaceUrl(selectedDashboardId), { replace: true });
        } else if (routeId) {
            navigate(dashboardsWorkspaceIndexPath, { replace: true });
        }
    }, [navigate, onDashboards, routeId, selectedDashboardId]);
};
