import { useDependencies } from '@/ui/di/dependencies';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import {
    chartsWorkspaceIndexPath,
    chartsWorkspaceNewPath,
    getChartWorkspaceModeFromPath,
    getChartWorkspaceUrl,
} from '../../lib/chartWorkspaceRoute';
import { useChartsPageActions, useChartsPageState } from './usePageState';

export function useChartsWorkspaceRouteSync() {
    const store = useDependencies().ui.charts;
    const preferences = useStore(
        store,
        useShallow(state => ({ id: state.rememberedChartId, mode: state.rememberedMode }))
    );
    const actions = useChartsPageActions();
    const location = useLocation();
    const navigate = useNavigate();
    const createDraft = useChartsPageState(state => state.createDraft);
    const showDatasetPicker = useChartsPageState(state => state.showDatasetPicker);

    useEffect(() => {
        if (location.pathname === chartsWorkspaceNewPath) {
            actions.openNewChartRoute();

            return;
        }
        const mode = getChartWorkspaceModeFromPath(location.pathname);
        const id = new URLSearchParams(location.search).get('id');
        if (mode) {
            if (!id) {
                actions.selectChart(null);
                navigate(chartsWorkspaceIndexPath, { replace: true });

                return;
            }
            actions.openChartRoute({ chartId: id, mode });

            return;
        }
    }, [location.pathname, location.search, navigate, actions]);

    useEffect(() => {
        if (location.pathname !== chartsWorkspaceIndexPath) {
            return;
        }
        if (createDraft || showDatasetPicker) {
            navigate(chartsWorkspaceNewPath, { replace: true });

            return;
        }
        if (preferences.id) {
            navigate(getChartWorkspaceUrl(preferences.id, preferences.mode), {
                replace: true,
            });
        }
    }, [
        location.pathname,
        location.search,
        navigate,
        actions,
        createDraft,
        showDatasetPicker,
        preferences.id,
        preferences.mode,
    ]);
}
