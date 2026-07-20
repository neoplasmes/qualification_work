import { useDependencies } from '@/ui/di/dependencies';
import { useContext, useMemo } from 'react';
import { useLocation } from 'react-router';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { chartsEditorContext } from '../editorOwner';
import type {
    ChartsPageStateStore,
    ChartsPreferences,
    ChartsWorkspaceMode,
} from '../pageState';

type State = ChartsPageStateStore &
    ChartsPreferences & {
        selectedChartId: string | null;
        workspaceMode: ChartsWorkspaceMode;
    };
export function useChartsPageState<T>(selector: (state: State) => T) {
    const editor = useContext(chartsEditorContext);
    if (!editor) {
        throw new Error('Charts editor owner is required');
    }
    const location = useLocation();
    const preferences = useStore(
        useDependencies().ui.charts,
        useShallow(state => ({
            rememberedChartId: state.rememberedChartId,
            rememberedMode: state.rememberedMode,
            chartsRightPanelTab: state.chartsRightPanelTab,
        }))
    );
    const preferenceActions = useDependencies().ui.charts.getState();

    return useStore(
        editor,
        useShallow(state =>
            selector({
                ...state,
                ...preferenceActions,
                ...preferences,
                selectedChartId: location.pathname.endsWith('/new')
                    ? null
                    : new URLSearchParams(location.search).get('id'),
                workspaceMode: location.pathname.endsWith('/edit') ? 'edit' : 'view',
            })
        )
    );
}
export function useChartsPageActions() {
    const editor = useContext(chartsEditorContext);
    if (!editor) {
        throw new Error('Charts editor owner is required');
    }
    const preferences = useDependencies().ui.charts;

    return useMemo(
        () => ({
            ...editor.getState(),
            ...preferences.getState(),
            selectChart(id: string | null) {
                preferences.getState().selectChart(id);
                editor.getState().selectChart(id);
            },
            openChartRoute(value: { chartId: string; mode: ChartsWorkspaceMode }) {
                preferences.setState({
                    rememberedChartId: value.chartId,
                    rememberedMode: value.mode,
                });
                editor.getState().openChartRoute(value);
            },
            openNewChartRoute() {
                preferences.getState().selectChart(null);
                editor.getState().openNewChartRoute();
            },
            setChartCreateDraft(
                value: Parameters<ChartsPageStateStore['setChartCreateDraft']>[0]
            ) {
                preferences.getState().selectChart(null);
                editor.getState().setChartCreateDraft(value);
            },
        }),
        [editor, preferences]
    );
}
