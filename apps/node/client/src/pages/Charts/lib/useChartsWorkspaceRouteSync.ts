import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import {
    openChartRoute,
    openNewChartRoute,
    selectChart,
    type ChartsWorkspaceMode,
} from '../model';
import {
    chartsWorkspaceIndexPath,
    chartsWorkspaceNewPath,
    getChartWorkspaceModeFromPath,
    getChartWorkspaceUrl,
} from './chartWorkspaceRoute';

type UseChartsWorkspaceRouteSyncParams = {
    selectedChartId: string | null;
    createDatasetId: string | null;
    showDatasetPicker: boolean;
    workspaceMode: ChartsWorkspaceMode;
};

export const useChartsWorkspaceRouteSync = ({
    selectedChartId,
    createDatasetId,
    showDatasetPicker,
    workspaceMode,
}: UseChartsWorkspaceRouteSyncParams) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const routeMode = getChartWorkspaceModeFromPath(location.pathname);
    const isNewRoute = location.pathname === chartsWorkspaceNewPath;
    const routeChartId = useMemo(
        () => new URLSearchParams(location.search).get('id'),
        [location.search]
    );

    useEffect(() => {
        if (isNewRoute) {
            dispatch(openNewChartRoute());

            return;
        }

        if (!routeMode) {
            return;
        }

        if (!routeChartId) {
            dispatch(selectChart(null));
            navigate(chartsWorkspaceIndexPath, { replace: true });

            return;
        }

        dispatch(openChartRoute({ chartId: routeChartId, mode: routeMode }));
    }, [dispatch, isNewRoute, navigate, routeChartId, routeMode]);

    useEffect(() => {
        if (location.pathname !== chartsWorkspaceIndexPath) {
            return;
        }

        if (createDatasetId || showDatasetPicker) {
            navigate(chartsWorkspaceNewPath, { replace: true });

            return;
        }

        if (!selectedChartId) {
            return;
        }

        navigate(getChartWorkspaceUrl(selectedChartId, workspaceMode), {
            replace: true,
        });
    }, [
        createDatasetId,
        location.pathname,
        navigate,
        selectedChartId,
        showDatasetPicker,
        workspaceMode,
    ]);
};
