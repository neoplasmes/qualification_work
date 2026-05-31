import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import {
    chartsWorkspaceIndexPath,
    getChartWorkspaceModeFromPath,
    getChartWorkspaceUrl,
} from '../../lib';
import { openChartRoute, selectChart, type ChartsWorkspaceMode } from '../../model';

type UseChartsWorkspaceRouteSyncParams = {
    selectedChartId: string | null;
    builderDatasetId: string | null;
    showDatasetPicker: boolean;
    workspaceMode: ChartsWorkspaceMode;
};

export const useChartsWorkspaceRouteSync = ({
    selectedChartId,
    builderDatasetId,
    showDatasetPicker,
    workspaceMode,
}: UseChartsWorkspaceRouteSyncParams) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const routeMode = getChartWorkspaceModeFromPath(location.pathname);
    const routeChartId = useMemo(
        () => new URLSearchParams(location.search).get('id'),
        [location.search]
    );

    useEffect(() => {
        if (!routeMode) {
            return;
        }

        if (!routeChartId) {
            dispatch(selectChart(null));
            navigate(chartsWorkspaceIndexPath, { replace: true });

            return;
        }

        dispatch(openChartRoute({ chartId: routeChartId, mode: routeMode }));
    }, [dispatch, navigate, routeChartId, routeMode]);

    useEffect(() => {
        if (
            location.pathname !== chartsWorkspaceIndexPath ||
            !selectedChartId ||
            builderDatasetId ||
            showDatasetPicker
        ) {
            return;
        }

        navigate(getChartWorkspaceUrl(selectedChartId, workspaceMode), {
            replace: true,
        });
    }, [
        builderDatasetId,
        location.pathname,
        navigate,
        selectedChartId,
        showDatasetPicker,
        workspaceMode,
    ]);
};
