import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ActionsWorkspaceTab = 'configure' | 'run';
export type ActionsRightPanelTab = 'history' | 'properties' | 'filters';

export type ActionsPageState = {
    selectedActionId: string | null;
    isCreatingAction: boolean;
    workspaceTab: ActionsWorkspaceTab;
    rightPanelTab: ActionsRightPanelTab;
};

type StateWithActionsPage = { actionsPage: ActionsPageState };

export const actionsPageInitialState: ActionsPageState = {
    selectedActionId: null,
    isCreatingAction: false,
    workspaceTab: 'configure',
    rightPanelTab: 'history',
};

export const actionsPageSlice = createSlice({
    name: 'actionsPage',
    initialState: actionsPageInitialState,
    reducers: {
        selectAction(state, action: PayloadAction<string | null>) {
            state.selectedActionId = action.payload;
            state.isCreatingAction = false;
            state.workspaceTab = action.payload ? state.workspaceTab : 'configure';
        },
        startCreateAction(state) {
            state.selectedActionId = null;
            state.isCreatingAction = true;
            state.workspaceTab = 'configure';
            state.rightPanelTab = 'properties';
        },
        cancelCreateAction(state) {
            state.isCreatingAction = false;
        },
        setActionsWorkspaceTab(state, action: PayloadAction<ActionsWorkspaceTab>) {
            state.workspaceTab = action.payload;
        },
        setActionsRightPanelTab(state, action: PayloadAction<ActionsRightPanelTab>) {
            state.rightPanelTab = action.payload;
        },
    },
});

export const {
    cancelCreateAction,
    selectAction,
    setActionsRightPanelTab,
    setActionsWorkspaceTab,
    startCreateAction,
} = actionsPageSlice.actions;

export const selectSelectedActionId = (state: StateWithActionsPage) =>
    state.actionsPage.selectedActionId;
export const selectIsCreatingAction = (state: StateWithActionsPage) =>
    state.actionsPage.isCreatingAction;
export const selectActionsWorkspaceTab = (state: StateWithActionsPage) =>
    state.actionsPage.workspaceTab;
export const selectActionsRightPanelTab = (state: StateWithActionsPage) =>
    state.actionsPage.rightPanelTab;
