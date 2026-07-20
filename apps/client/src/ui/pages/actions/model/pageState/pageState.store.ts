import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

export type ActionsWorkspaceMode = 'view' | 'edit';
export type ActionsRightPanelTab = 'history' | 'properties' | 'filters';

export type ActionsPageState = {
    rememberedActionId: string | null;
    isCreatingAction: boolean;
    rememberedMode: ActionsWorkspaceMode;
    rightPanelTab: ActionsRightPanelTab;
};

export const actionsPageInitialState: ActionsPageState = {
    rememberedActionId: null,
    isCreatingAction: false,
    rememberedMode: 'view',
    rightPanelTab: 'history',
};

export type ActionsPageStateStore = ActionsPageState & {
    selectAction(value: string | null): void;
    openActionRoute(value: { actionId: string; mode: ActionsWorkspaceMode }): void;
    startCreateAction(): void;
    cancelCreateAction(): void;
    setActionsWorkspaceMode(value: ActionsWorkspaceMode): void;
    setActionsRightPanelTab(value: ActionsRightPanelTab): void;
};

export function createActionsPageStore(initial: Partial<ActionsPageState> = {}) {
    return createStore<ActionsPageStateStore>()(
        immer(set => ({
            ...actionsPageInitialState,
            ...initial,
            selectAction: value =>
                set(state => {
                    const actionChanged = state.rememberedActionId !== value;

                    state.rememberedActionId = value;
                    state.isCreatingAction = false;

                    if (!value || actionChanged) {
                        state.rememberedMode = 'view';
                    }
                }),
            openActionRoute: value =>
                set(state => {
                    state.rememberedActionId = value.actionId;
                    state.isCreatingAction = false;
                    state.rememberedMode = value.mode;
                }),
            startCreateAction: () =>
                set(state => {
                    state.rememberedActionId = null;
                    state.isCreatingAction = true;
                    state.rememberedMode = 'edit';
                    state.rightPanelTab = 'properties';
                }),
            cancelCreateAction: () =>
                set(state => {
                    state.isCreatingAction = false;
                }),
            setActionsWorkspaceMode: value =>
                set(state => {
                    state.rememberedMode = value;
                }),
            setActionsRightPanelTab: value =>
                set(state => {
                    state.rightPanelTab = value;
                }),
        }))
    );
}
