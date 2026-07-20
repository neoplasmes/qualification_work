import { createStore } from 'zustand/vanilla';

import type { ChartsRightPanelTab, ChartsWorkspaceMode } from './pageState.store';

export interface ChartsPreferences {
    rememberedChartId: string | null;
    rememberedMode: ChartsWorkspaceMode;
    chartsRightPanelTab: ChartsRightPanelTab;
    selectChart(id: string | null): void;
    setChartsWorkspaceMode(mode: ChartsWorkspaceMode): void;
    setChartsRightPanelTab(tab: ChartsRightPanelTab): void;
}
export function createChartsPreferencesStore() {
    return createStore<ChartsPreferences>()(set => ({
        rememberedChartId: null,
        rememberedMode: 'view',
        chartsRightPanelTab: 'properties',
        selectChart: id =>
            set(state => ({
                rememberedChartId: id,
                rememberedMode:
                    id === state.rememberedChartId ? state.rememberedMode : 'view',
            })),
        setChartsWorkspaceMode: rememberedMode => set({ rememberedMode }),
        setChartsRightPanelTab: chartsRightPanelTab => set({ chartsRightPanelTab }),
    }));
}
