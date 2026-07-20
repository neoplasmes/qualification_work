import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

export type DashboardsRightPanelTab = 'properties' | 'filters';

export type DashboardsPageState = {
    rememberedDashboardId: string | null;
    dashboardsRightPanelTab: DashboardsRightPanelTab;
    workspaceDraftDashboardId: string | null;
    workspaceDraftName: string;
};

export const dashboardsPageInitialState: DashboardsPageState = {
    rememberedDashboardId: null,
    dashboardsRightPanelTab: 'properties',
    workspaceDraftDashboardId: null,
    workspaceDraftName: '',
};

export type DashboardsPageStateStore = DashboardsPageState & {
    selectDashboard(value: string | null): void;
    setDashboardsRightPanelTab(value: DashboardsRightPanelTab): void;
    initDashboardsWorkspaceDraft(value: { dashboardId: string; name: string }): void;
    resetDashboardsWorkspaceDraft(): void;
    setDashboardsWorkspaceDraftName(value: string): void;
};

export function createDashboardsPageStore(initial: Partial<DashboardsPageState> = {}) {
    return createStore<DashboardsPageStateStore>()(
        immer(set => ({
            ...dashboardsPageInitialState,
            ...initial,
            selectDashboard: value =>
                set(state => {
                    state.rememberedDashboardId = value;
                }),
            setDashboardsRightPanelTab: value =>
                set(state => {
                    state.dashboardsRightPanelTab = value;
                }),
            initDashboardsWorkspaceDraft: value =>
                set(state => {
                    state.workspaceDraftDashboardId = value.dashboardId;
                    state.workspaceDraftName = value.name;
                }),
            resetDashboardsWorkspaceDraft: () =>
                set(state => {
                    state.workspaceDraftDashboardId = null;
                    state.workspaceDraftName = '';
                }),
            setDashboardsWorkspaceDraftName: value =>
                set(state => {
                    state.workspaceDraftName = value;
                }),
        }))
    );
}
